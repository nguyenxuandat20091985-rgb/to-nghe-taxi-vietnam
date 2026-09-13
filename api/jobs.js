const RSS_BASE='https://news.google.com/rss/search';
const UA='ToNgheTaxi-Jobs/1.0';
const PROVIDERS=[
 {name:'Glints',domain:'glints.com/vn',mode:'public-discovery'},
 {name:'TopCV',domain:'topcv.vn',mode:'public-discovery'},
 {name:'Vieclam24h',domain:'vieclam24h.vn',mode:'public-discovery'}
];
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');res.end(JSON.stringify(body))}
function clean(v,n=100){return String(v||'').trim().slice(0,n)}
function parse(xml,provider,area){
 const out=[],re=/<item>([\s\S]*?)<\/item>/g;let m;
 while((m=re.exec(xml))&&out.length<8){
  const b=m[1],get=t=>{const x=b.match(new RegExp('<'+t+'>([\\s\\S]*?)<\\/'+t+'>'));return x?x[1].replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim():''};
  const title=get('title'),link=get('link'),pubDate=get('pubDate');
  if(title&&link)out.push({title,link,pubDate,source:provider,area});
 }
 return out;
}
async function provider(p,q,area){
 const query=q+' '+area+' site:'+p.domain;
 const url=RSS_BASE+'?q='+encodeURIComponent(query)+'&hl=vi&gl=VN&ceid=VN:vi';
 const r=await fetch(url,{headers:{'User-Agent':UA}});if(!r.ok)throw new Error('UPSTREAM');
 return parse(await r.text(),p.name,area);
}
module.exports=async function(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const q=clean(req.query?.q||'tài xế'),area=clean(req.query?.area||'toàn quốc'),type=clean(req.query?.type||'all',30);
 const typeTerms={driver:'tài xế',shipper:'shipper giao hàng',logistics:'logistics vận tải',dispatcher:'điều phối vận tải'};
 const finalQ=(type!=='all'?(typeTerms[type]||'')+' ':'')+q;
 try{
  const settled=await Promise.allSettled(PROVIDERS.map(p=>provider(p,finalQ,area)));
  let items=[];for(const x of settled)if(x.status==='fulfilled')items.push(...x.value);
  const seen=new Set();items=items.filter(x=>{const k=x.link||x.title;if(seen.has(k))return false;seen.add(k);return true});
  items.sort((a,b)=>new Date(b.pubDate||0)-new Date(a.pubDate||0));
  return send(res,200,{items:items.slice(0,18),providers:PROVIDERS.map(x=>({name:x.name,mode:x.mode}))});
 }catch(e){return send(res,502,{error:'Job sources unavailable'})}
};