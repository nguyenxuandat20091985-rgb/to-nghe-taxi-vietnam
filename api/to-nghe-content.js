const RSS_BASE = 'https://news.google.com/rss/search';
const USER_AGENT = 'ToNgheTaxi/1.0';

function send(res, status, body){
  res.statusCode = status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
  res.end(JSON.stringify(body));
}

function clean(value, max=120){
  return String(value || '').trim().slice(0,max);
}

function parseRss(xml){
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while((m=re.exec(xml)) && items.length < 8){
    const block=m[1];
    const get=(tag)=>{
      const x=block.match(new RegExp('<'+tag+'>([\\s\\S]*?)<\\/'+tag+'>'));
      return x ? x[1].replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'\"').replace(/&#39;/g,"'").trim() : '';
    };
    const title=get('title'), link=get('link'), pubDate=get('pubDate'), source=get('source');
    if(title && link) items.push({title,link,pubDate,source});
  }
  return items;
}

async function news(query){
  const url=RSS_BASE+'?q='+encodeURIComponent(query+' taxi tài xế Việt Nam')+'&hl=vi&gl=VN&ceid=VN:vi';
  const r=await fetch(url,{headers:{'User-Agent':USER_AGENT}});
  if(!r.ok) throw new Error('NEWS_UPSTREAM_'+r.status);
  return parseRss(await r.text());
}

async function services(query, lat, lon){
  if(!Number.isFinite(lat)||!Number.isFinite(lon)) return [];
  const q=encodeURIComponent(query);
  const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=vi&q='+q+'&lat='+lat+'&lon='+lon;
  const r=await fetch(url,{headers:{'User-Agent':USER_AGENT+' contact: to-nghe-taxi'}});
  if(!r.ok) throw new Error('MAP_UPSTREAM_'+r.status);
  const data=await r.json();
  return data.map(x=>{
    const lat2=Number(x.lat), lon2=Number(x.lon);
    const R=6371, p=Math.PI/180;
    const a=Math.sin((lat2-lat)*p/2)**2+Math.cos(lat*p)*Math.cos(lat2*p)*Math.sin((lon2-lon)*p/2)**2;
    const distanceKm=2*R*Math.asin(Math.sqrt(a));
    return {name:x.display_name?.split(',')[0]||'Dịch vụ',address:x.display_name||'',lat:lat2,lon:lon2,type:x.type||'',distanceKm};
  }).filter(x=>x.distanceKm<=10);
}

export default async function handler(req,res){
  if(req.method!=='GET') return send(res,405,{error:'Method not allowed'});
  const type=clean(req.query?.type,30);
  try{
    if(type==='news'){
      const q=clean(req.query?.q||'tin nghề taxi',100);
      return send(res,200,{items:await news(q)});
    }
    if(type==='services'){
      const q=clean(req.query?.q||'gara ô tô',100);
      const lat=Number(req.query?.lat), lon=Number(req.query?.lon);
      return send(res,200,{items:await services(q,lat,lon)});
    }
    return send(res,400,{error:'Unsupported content type'});
  }catch(e){
    return send(res,502,{error:'Content service unavailable'});
  }
}
