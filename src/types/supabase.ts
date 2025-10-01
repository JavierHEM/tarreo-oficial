// src/types/supabase.ts
export interface Profile {
    id: string
    email: string
    full_name?: string
    gamertag?: string
    rut?: string
    carrera?: string
    role: 'admin' | 'gamer'
    elo_valorant?: number
    elo_lol?: number
    elo_fortnite?: number
    rank_valorant?: string
    rank_lol?: string
    rank_fortnite?: string
    preferred_position?: string
    preferred_games?: string[]
    available_schedule?: string
    bio?: string
    is_looking_for_team: boolean
    created_at: string
    updated_at: string
  }
  
  export interface Team {
    id: number
    name: string
    captain_id: string
    description?: string
    is_looking_for_players: boolean
    required_positions?: string[]
    created_at: string
    updated_at: string
    captain?: Profile
    members?: TeamMember[]
  }
  
  export interface TeamMember {
    id: number
    team_id: number
    player_id: string
    position?: string
    status: 'active' | 'inactive' | 'pending'
    joined_at: string
    player?: Profile
  }
  
  export interface Game {
    id: number
    name: string
    platform_id: number
    max_team_size: number
    created_at: string
    platform?: Platform
  }
  
  export interface Platform {
    id: number
    name: string
    created_at: string
  }
  
  export interface Tournament {
    id: number
    name: string
    game_id: number
    status: 'registration_open' | 'registration_closed' | 'online_phase' | 'presencial_phase' | 'finished'
    registration_start: string
    registration_end?: string
    online_phase_start?: string
    online_phase_end?: string
    presencial_date?: string
    max_teams?: number
    description?: string
    created_at: string
    created_by: string
    game?: Game
  }