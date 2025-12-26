import json
import os
import base64
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

def handler(event: dict, context) -> dict:
    '''API для загрузки и обновления аватарок пользователей'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
            """SELECT u.id FROM users u 
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
        
        user_id = user['id']
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            image_base64 = body.get('image')
            
            if not image_base64:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Image data required'}),
                    'isBase64Encoded': False
                }
            
            try:
                image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
            except Exception:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid image format'}),
                    'isBase64Encoded': False
                }
            
            content_type = 'image/jpeg'
            if image_base64.startswith('data:image/png'):
                content_type = 'image/png'
            elif image_base64.startswith('data:image/webp'):
                content_type = 'image/webp'
            
            file_extension = content_type.split('/')[-1]
            filename = f"avatars/{user_id}_{secrets.token_hex(8)}.{file_extension}"
            
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
            )
            
            s3.put_object(
                Bucket='files',
                Key=filename,
                Body=image_data,
                ContentType=content_type
            )
            
            avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
            
            cur.execute(
                "UPDATE users SET avatar_url = %s, updated_at = NOW() WHERE id = %s RETURNING id, email, name, nickname, team, avatar_url",
                (avatar_url, user_id)
            )
            updated_user = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': dict(updated_user),
                    'avatar_url': avatar_url
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
