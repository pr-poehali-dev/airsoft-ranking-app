import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для административных функций: управление игроками, командами, матчами'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    session_token = event.get('headers', {}).get('X-Session-Token') or event.get('headers', {}).get('x-session-token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session token required'}),
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            """SELECT u.id, u.is_admin FROM users u 
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
        
        if not user['is_admin']:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Admin access required'}),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_team':
                name = body.get('name', '').strip()
                description = body.get('description', '').strip()
                
                if not name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Team name required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO teams (name, description) VALUES (%s, %s) RETURNING *",
                    (name, description or None)
                )
                team = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'team': dict(team)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_player_to_team':
                team_id = body.get('team_id')
                player_id = body.get('player_id')
                role = body.get('role', 'member')
                
                if not team_id or not player_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Team ID and Player ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO team_members (team_id, user_id, role) VALUES (%s, %s, %s) ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role RETURNING *",
                    (team_id, player_id, role)
                )
                member = cur.fetchone()
                
                cur.execute("UPDATE users SET team = (SELECT name FROM teams WHERE id = %s) WHERE id = %s", (team_id, player_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'member': dict(member)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'ban_player':
                player_id = body.get('player_id')
                banned = body.get('banned', True)
                
                if not player_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Player ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "UPDATE users SET is_banned = %s WHERE id = %s RETURNING id, email, name, is_banned",
                    (banned, player_id)
                )
                player = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'player': dict(player)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'create_match':
                title = body.get('title', '').strip()
                match_type = body.get('match_type', 'Турнир')
                match_date = body.get('match_date')
                max_players = body.get('max_players')
                team1_id = body.get('team1_id')
                team2_id = body.get('team2_id')
                
                if not title or not match_date:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Title and match date required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """INSERT INTO matches (title, match_type, match_date, max_players, team1_id, team2_id, created_by) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
                    (title, match_type, match_date, max_players, team1_id, team2_id, user['id'])
                )
                match = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'match': dict(match)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'complete_match':
                match_id = body.get('match_id')
                winner_team_id = body.get('winner_team_id')
                score_team1 = body.get('score_team1', 0)
                score_team2 = body.get('score_team2', 0)
                duration_minutes = body.get('duration_minutes')
                
                if not match_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Match ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """UPDATE matches SET status = 'completed', winner_team_id = %s, 
                       score_team1 = %s, score_team2 = %s, duration_minutes = %s 
                       WHERE id = %s RETURNING *""",
                    (winner_team_id, score_team1, score_team2, duration_minutes, match_id)
                )
                match = cur.fetchone()
                
                if winner_team_id:
                    cur.execute("UPDATE teams SET matches_played = matches_played + 1, matches_won = matches_won + 1, rating = rating + 50 WHERE id = %s", (winner_team_id,))
                    loser_team_id = match['team1_id'] if match['team1_id'] != winner_team_id else match['team2_id']
                    if loser_team_id:
                        cur.execute("UPDATE teams SET matches_played = matches_played + 1, rating = rating - 25 WHERE id = %s", (loser_team_id,))
                
                cur.execute("SELECT user_id, team_id FROM match_participants WHERE match_id = %s", (match_id,))
                participants = cur.fetchall()
                
                for p in participants:
                    is_winner = p['team_id'] == winner_team_id if p['team_id'] else False
                    rating_change = 30 if is_winner else -15
                    cur.execute(
                        "UPDATE users SET matches_played = matches_played + 1, matches_won = matches_won + %s, rating = rating + %s WHERE id = %s",
                        (1 if is_winner else 0, rating_change, p['user_id'])
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'match': dict(match)}),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            cur.execute("SELECT id, name, email, rating, matches_played, matches_won, team, is_banned, is_admin FROM users ORDER BY rating DESC")
            players = cur.fetchall()
            
            cur.execute("SELECT * FROM teams ORDER BY rating DESC")
            teams = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'players': [dict(p) for p in players],
                    'teams': [dict(t) for t in teams]
                }),
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
