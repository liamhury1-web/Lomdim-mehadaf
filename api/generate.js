const M=process.env.GEMINI_MODEL||'gemini-flash-latest';
const P=`Study pages from a Hebrew-speaking student in Israel. Turn them into quiz material. Use only what is on the pages; for exercises you may write similar new ones, solved correctly. Keep terms in their language; translate to Hebrew if no translation is given. Explanations: one short Hebrew sentence. Math: Unicode, no LaTeX.
Reply ONLY JSON:
{"title":"Hebrew topic, max 40 chars","termLang":"en","defLang":"he","alphabet":false,
"cards":[{"term":"","def":""}],
"mcq":[{"q":"","options":["","","",""],"answer":0,"explain":""}],
"scramble":[{"word":"","hint":""}],
"topics":[{"name":"Hebrew topic","query":"YouTube search"}],
"lesson":[{"title":"Hebrew heading","body":"Hebrew explanation with example, paragraphs split by \\n"}]}
cards 6-40, mcq 6-20 (vary answer position), scramble only single words 3-12 letters, topics 2-5, lesson 3-6 sections. alphabet true only if pages teach letters.`;
const L=`A Hebrew-speaking student studies this material. Write a simple Hebrew lesson and video topics. Reply ONLY JSON: {"lesson":[{"title":"","body":""}],"topics":[{"name":"","query":"YouTube search"}]}. lesson 3-6 sections, topics 2-5.\n\n`;
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({code:'method'});
  const k=process.env.GEMINI_API_KEY;
  if(!k)return res.status(500).json({code:'no_key'});
  let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}b=b||{};
  const parts=[];
  if(b.mode==='lesson')parts.push({text:L+String(b.material||'').slice(0,12000)});
  else{
    const im=Array.isArray(b.images)?b.images.slice(0,4):[];
    if(!im.length)return res.status(400).json({code:'bad_request'});
    for(const i of im)parts.push({inline_data:{mime_type:i.type||'image/jpeg',data:String(i.data||'')}});
    parts.push({text:P+(b.note?'\nStudent note: '+String(b.note).slice(0,300):'')});
  }
  try{
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+M+':generateContent',{method:'POST',headers:{'x-goog-api-key':k,'content-type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',maxOutputTokens:16000}})});
    const d=await r.json().catch(()=>null);
    if(!r.ok){console.error(r.status,d?.error?.message);return res.status(r.status===429?429:503).json({code:r.status===429?'rate':'busy'})}
    const t=(d?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');
    const a=t.indexOf('{'),z=t.lastIndexOf('}');
    return res.status(200).json({result:JSON.parse(t.slice(a,z+1))});
  }catch(e){console.error(e);return res.status(502).json({code:'bad_json'})}
}
