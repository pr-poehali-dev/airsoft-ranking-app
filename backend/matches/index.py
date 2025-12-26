import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления матчами: просмотр, регистрация на матч'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            cur.execute("""
                SELECT m.*, 
                       t1.name as team1_name, 
                       t2.name as team2_name,
                       tw.name as winner_name,
                       COUNT(DISTINCT mp.user_id) as registered_players
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                LEFT JOIN teams tw ON m.winner_team_id = tw.id
                LEFT JOIN match_participants mp ON m.id = mp.match_id
                GROUP BY m.id, t1.name, t2.name, tw.name
                ORDER BY m.match_date DESC
            """)
            matches = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'matches': [dict(m) for m in matches]}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            session_token = event.get('headers', {}).get('X-Session-Token') or event.get('headers', {}).get('x-session-token')
            
            if not session_token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Session token required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """SELECT u.id, u.is_banned, tm.team_id FROM users u 
                   LEFT JOIN team_members tm ON u.id = tm.user_id
                   JOIN user_sessions s ON u.id = s.user_id 
                   WHERE s.session_token = %s AND s.expires_at > NOW()""",
                (session_token,)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid or expired session'}),
                    'isBase64Encoded': False
                }
            
            if user['is_banned']:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'You are banned from joining matches'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'join_match':
                match_id = body.get('match_id')
                
                if not match_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Match ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT status, max_players FROM matches WHERE id = %s", (match_id,))
                match = cur.fetchone()
                
                if not match or match['status'] != 'upcoming':
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Match not available for registration'}),
                        'isBase64Encoded': False
                    }
                
                if match['max_players']:
                    cur.execute("SELECT COUNT(*) as count FROM match_participants WHERE match_id = %s", (match_id,))
                    count = cur.fetchone()['count']
                    if count >= match['max_players']:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Match is full'}),
                            'isBase64Encoded': False
                        }
                
                cur.execute(
                    """INSERT INTO match_participants (match_id, user_id, team_id) 
                       VALUES (%s, %s, %s) 
                       ON CONFLICT (match_id, user_id) DO NOTHING 
                       RETURNING *""",
                    (match_id, user['id'], user['team_id'])
                )
                participant = cur.fetchone()
                conn.commit()
                
                if participant:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'Successfully joined match', 'participant': dict(participant)}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'Already registered for this match'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'leave_match':
                match_id = body.get('match_id')
                
                if not match_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Match ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "UPDATE match_participants SET status = 'cancelled' WHERE match_id = %s AND user_id = %s",
                    (match_id, user['id'])
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Left match successfully'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()
