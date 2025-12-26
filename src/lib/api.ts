const ADMIN_API = 'https://functions.poehali.dev/7efe1bf4-081f-4b82-ad31-d938f1c6db55';
const MATCHES_API = 'https://functions.poehali.dev/b020f68d-cee0-4be1-bd96-609c331f885b';

const getToken = () => localStorage.getItem('session_token');

export interface Team {
  id: number;
  name: string;
  description?: string;
  rating: number;
  matches_played: number;
  matches_won: number;
}

export interface Player {
  id: number;
  name: string;
  email: string;
  rating: number;
  matches_played: number;
  matches_won: number;
  team?: string;
  is_banned: boolean;
  is_admin: boolean;
}

export interface Match {
  id: number;
  title: string;
  match_type: string;
  match_date: string;
  status: string;
  max_players?: number;
  team1_id?: number;
  team2_id?: number;
  team1_name?: string;
  team2_name?: string;
  winner_team_id?: number;
  winner_name?: string;
  score_team1: number;
  score_team2: number;
  duration_minutes?: number;
  registered_players: number;
}

export const adminAPI = {
  async getAdminData(): Promise<{ players: Player[]; teams: Team[] }> {
    const response = await fetch(ADMIN_API, {
      headers: { 'X-Session-Token': getToken() || '' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch admin data');
    }
    
    return response.json();
  },

  async createTeam(name: string, description?: string): Promise<Team> {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getToken() || '',
      },
      body: JSON.stringify({ action: 'create_team', name, description }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create team');
    }
    
    const result = await response.json();
    return result.team;
  },

  async addPlayerToTeam(teamId: number, playerId: number, role = 'member'): Promise<void> {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getToken() || '',
      },
      body: JSON.stringify({ action: 'add_player_to_team', team_id: teamId, player_id: playerId, role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add player to team');
    }
  },

  async banPlayer(playerId: number, banned = true): Promise<void> {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getToken() || '',
      },
      body: JSON.stringify({ action: 'ban_player', player_id: playerId, banned }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to ban player');
    }
  },

  async createMatch(data: {
    title: string;
    match_type: string;
    match_date: string;
    max_players?: number;
    team1_id?: number;
    team2_id?: number;
  }): Promise<Match> {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getToken() || '',
      },
      body: JSON.stringify({ action: 'create_match', ...data }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create match');
    }
    
    const result = await response.json();
    return result.match;
  },

  async completeMatch(data: {
    match_id: number;
    winner_team_id?: number;
    score_team1: number;
    score_team2: number;
    duration_minutes?: number;
  }): Promise<Match> {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getToken() || '',
      },
      body: JSON.stringify({ action: 'complete_match', ...data }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete match');
    }
    
    const result = await response.json();
    return result.match;
  },
};

export const matchesAPI = {
  async getMatches(): Promise<Match[]> {
    const response = await fetch(MATCHES_API);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch matches');
    }
    
    const result = await response.json();
    return result.matches;
  },

  async joinMatch(matchId: number): Promise<void> {
    const response = await fetch(MATCHES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getToken() || '',
      },
      body: JSON.stringify({ action: 'join_match', match_id: matchId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join match');
    }
  },

  async leaveMatch(matchId: number): Promise<void> {
    const response = await fetch(MATCHES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getToken() || '',
      },
      body: JSON.stringify({ action: 'leave_match', match_id: matchId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to leave match');
    }
  },
};
