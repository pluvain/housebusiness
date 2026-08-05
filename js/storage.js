// Storage manager - local only, privacy first
const Store = {
  key: 'hb_agent_v2',
  get(){
    try{ return JSON.parse(localStorage.getItem(this.key) || '{}'); }catch{return {};}
  },
  set(obj){
    const cur = this.get();
    localStorage.setItem(this.key, JSON.stringify({...cur, ...obj}));
  },
  getLeads(){
    try{ return JSON.parse(localStorage.getItem('hb_leads')||'[]'); }catch{return [];}
  },
  setLeads(leads){
    localStorage.setItem('hb_leads', JSON.stringify(leads));
  },
  getChats(){
    try{ return JSON.parse(localStorage.getItem('hb_chats')||'[]'); }catch{return [];}
  },
  setChats(chats){
    localStorage.setItem('hb_chats', JSON.stringify(chats.slice(-50)));
  }
};
