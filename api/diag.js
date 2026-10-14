export default async function handler(req,res){
  const k=process.env.GEMINI_API_KEY||'';
  const M=process.env.GEMINI_MODEL||'gemini-flash-latest';
  const info={hasKey:!!k,keyLength:k.length,keyStart:k.slice(0,3),keyHasSpaces:/\s/.test(k),geminiVarNames:Object.keys(process.env).filter(n=>/gemini/i.test(n)),model:M};
  try{
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+M+':generateContent',{method:'POST',headers:{'x-goog-api-key':k.trim(),'content-type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply with the word OK'}]}]})});
    const d=await r.json().catch(()=>null);
    info.status=r.status;info.googleError=d?.error?.message||null;info.reply=d?.candidates?.[0]?.content?.parts?.[0]?.text||null;
  }catch(e){info.fetchError=String(e)}
  res.setHeader('Cache-Control','no-store');
  res.status(200).json(info);
}
