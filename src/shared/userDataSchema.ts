export const CLOUD_KEYS=[
 'openvoley_saved_teams_v1','openvoley_saved_matches_v1','openvoley_current_match_v1','openvoley_user_cuts','openvoley_ai_rallies',
 'openvoley_training_sessions_v1','openvoley_smart_sports_montages_v1','openvoley.recovery.deleted.v1',
 'openvoley_boxscore_cols','openvoley.courtSides','openvoley.courtView','openvoley_scouting_mode',
 'openvoley.scoutButtons.v1','openvoley_new_match_draft_v2','openvoley_recent_home_team_id'
];
export function isCloudKey(key:string){return CLOUD_KEYS.includes(key)||/^openvoley\.whiteboard\.v1\.[a-zA-Z0-9_-]{1,120}$/.test(key);}
export function validateCloudValue(key:string,value:unknown){
 if(!isCloudKey(key))return false;if(value===null)return true;
 const serialized=JSON.stringify(value);if(serialized===undefined||serialized.length>20*1024*1024)return false;
 if(['openvoley_saved_teams_v1','openvoley_saved_matches_v1','openvoley_training_sessions_v1','openvoley_smart_sports_montages_v1','openvoley_user_cuts','openvoley_ai_rallies'].includes(key)){
  if(!Array.isArray(value)||value.length>10000)return false;
  return value.every(v=>v&&typeof v==='object'&&typeof v.id==='string'&&v.id.length>0&&v.id.length<=200);
 }
 if(key==='openvoley_current_match_v1')return !!value&&typeof value==='object'&&typeof (value as any).id==='string'&&Array.isArray((value as any).homePlayers)&&Array.isArray((value as any).awayPlayers);
 if(key.startsWith('openvoley.whiteboard.'))return !!value&&typeof value==='object'&&Array.isArray((value as any).tokens)&&Array.isArray((value as any).strokes);
 return ['string','boolean','number','object'].includes(typeof value);
}
