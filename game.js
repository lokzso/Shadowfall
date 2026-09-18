(()=>{"use strict";
const C=document.getElementById("game"),ctx=C.getContext("2d",{alpha:false});
const boot=document.getElementById("boot"),status=document.getElementById("status"),prog=document.getElementById("progress"),err=document.getElementById("err");
const hud=document.getElementById("hud"),questEl=document.getElementById("quest"),panel=document.getElementById("panel"),picker=document.getElementById("picker"),heroesEl=document.getElementById("heroes");
window.onerror=(m,s,l,c,e)=>{boot.style.display="flex";status.textContent="Ошибка запуска";err.textContent=`${m}\nстрока ${l}:${c}\n${e?.stack||""}`};
const HEROES={
 warrior:{name:"Воин",color:"#4ea5ff",hp:160,mp:85,atk:25,speed:230,skills:"Рывок • Вихрь • Клич • Казнь"},
 mage:{name:"Маг",color:"#b06cff",hp:105,mp:190,atk:21,speed:220,skills:"Огонь • Лёд • Телепорт • Метеор"},
 ranger:{name:"Следопыт",color:"#55d47b",hp:120,mp:130,atk:23,speed:250,skills:"Выстрел • Ловушка • Ускорение • Град стрел"}
};
const world={w:3000,h:1900}, keys={}, enemies=[],creeps=[],towers=[],buildings=[],trees=[];
let DPR=1,cam={x:0,y:0},last=0,joy={x:0,y:0},selected="warrior",started=false;
let state={x:610,y:940,level:1,xp:0,gold:250,quest:0,kills:0,talents:0,inv:["Зелье здоровья","Зелье маны","Свиток возврата"],weapon:"Ржавый меч",armor:"Кожаная броня"};
let player={x:610,y:940,r:18,hp:160,mp:85,maxhp:160,maxmp:85,atk:25,speed:230,cd:{Q:0,W:0,E:0,R:0}};
function resize(){DPR=Math.min(devicePixelRatio||1,2);C.width=innerWidth*DPR;C.height=innerHeight*DPR;C.style.width=innerWidth+"px";C.style.height=innerHeight+"px";ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize);resize();
function load(){try{let s=JSON.parse(localStorage.getItem("shadowfall-warborn-v2"));if(s)state={...state,...s}}catch(e){}}
function save(){state.x=player.x;state.y=player.y;state.hp=player.hp;state.mp=player.mp;state.selected=selected;localStorage.setItem("shadowfall-warborn-v2",JSON.stringify(state))}
function applyHero(k,keep=true){selected=k;let h=HEROES[k],x=keep?state.x:610,y=keep?state.y:940;player={x,y,r:18,hp:state.hp||h.hp,mp:state.mp||h.mp,maxhp:h.hp+(state.level-1)*8,maxmp:h.mp,atk:h.atk+(state.level-1)*3+(state.weapon==="Клинок Стража"?12:0),speed:h.speed,cd:{Q:0,W:0,E:0,R:0}}}
function spawnEnemy(x,y,boss=false,lane=false){enemies.push({x,y,r:boss?31:15,hp:boss?480:58,maxhp:boss?480:58,dmg:boss?18:7,speed:boss?48:65,boss,lane,lastHit:0,dead:false})}
function setupWorld(){for(let i=0;i<110;i++)trees.push({x:60+Math.random()*2880,y:60+Math.random()*1780,r:9+Math.random()*15});for(let i=0;i<34;i++)spawnEnemy(950+Math.random()*1700,160+Math.random()*1550);spawnEnemy(2500,460,true);spawnEnemy(2540,1450,true);[[850,300,1],[1450,300,1],[850,1600,1],[1450,1600,1],[2450,300,2],[2700,300,2],[2450,1600,2],[2700,1600,2]].forEach(a=>towers.push({x:a[0],y:a[1],team:a[2]}))}
function spawnLane(){[300,1600].forEach(y=>{creeps.push({x:700,y,team:1,hp:40,last:0});spawnEnemy(2620,y,false,true)})}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function nearEnemy(r){return enemies.filter(e=>!e.dead&&dist(player,e)<r).sort((a,b)=>dist(player,a)-dist(player,b))}
function damage(e,n){if(!e||e.dead)return;e.hp-=n;if(e.hp<=0){e.dead=true;state.gold+=e.boss?120:10;state.xp+=e.boss?90:15;state.kills++;if(e.boss&&state.quest===2)state.quest=3;while(state.xp>=100){state.xp-=100;state.level++;state.talents++;player.maxhp+=8;player.hp=player.maxhp;player.atk+=3}}}
function cast(k){let cost={Q:10,W:15,E:18,R:35}[k],now=performance.now();if(player.mp<cost||player.cd[k]>now)return;player.mp-=cost;player.cd[k]=now+({Q:650,W:1200,E:1800,R:5000}[k]);let list=nearEnemy(k==="R"?330:240),mult={Q:1.15,W:.9,E:.8,R:2.6}[k];if(k==="E"&&selected==="warrior")player.hp=Math.min(player.maxhp,player.hp+24);if(k==="E"&&selected==="mage"&&list[0]){player.x=list[0].x-85;player.y=list[0].y}list.slice(0,k==="R"?8:k==="W"?4:1).forEach(e=>damage(e,Math.round(player.atk*mult)))}
function interact(){let npc={x:510,y:820},shop={x:650,y:760};if(dist(player,npc)<90){if(state.quest===0)state.quest=1;else if(state.quest===1&&state.kills>=5)state.quest=2;else if(state.quest===3){state.quest=4;state.gold+=300;state.weapon="Клинок Стража";state.inv.push("Клинок Стража");player.atk+=12}}else if(dist(player,shop)<90&&state.gold>=50){state.gold-=50;state.inv.push("Большое зелье")}}
function inventory(){panel.style.display=panel.style.display==="block"?"none":"block";panel.textContent=`ИНВЕНТАРЬ / ЭКИПИРОВКА\nОружие: ${state.weapon}\nБроня: ${state.armor}\n\n${state.inv.map((x,i)=>`${i+1}. ${x}`).join("\n")}\n\nТаланты: ${state.talents}` }
function build(){if(state.gold>=100){state.gold-=100;buildings.push({x:player.x+70,y:player.y});}}
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if("qwer".includes(e.key.toLowerCase()))cast(e.key.toUpperCase());if(e.key.toLowerCase()==="f")interact();if(e.key.toLowerCase()==="i")inventory();if(e.key.toLowerCase()==="b")build();if(e.key.toLowerCase()==="t"&&state.talents){state.talents--;player.atk+=5;player.maxhp+=10;player.hp+=10}});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
C.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch"){let wx=e.clientX+cam.x,wy=e.clientY+cam.y;player.target={x:wx,y:wy}}});
document.querySelectorAll("[data-skill]").forEach(b=>b.onclick=()=>cast(b.dataset.skill));
document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>b.dataset.act==="F"?interact():b.dataset.act==="I"?inventory():build());
const joyEl=document.getElementById("joy"),knob=document.getElementById("knob");
function joyMove(e){let r=joyEl.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),l=Math.max(1,Math.hypot(x,y)),m=Math.min(34,l);knob.style.transform=`translate(${x/l*m}px,${y/l*m}px)`;joy.x=l>8?x/l:0;joy.y=l>8?y/l:0}
joyEl.addEventListener("pointerdown",e=>{joyEl.setPointerCapture(e.pointerId);joyMove(e)});joyEl.addEventListener("pointermove",e=>{if(joyEl.hasPointerCapture(e.pointerId))joyMove(e)});joyEl.addEventListener("pointerup",e=>{joy.x=joy.y=0;knob.style.transform=""});
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x-cam.x,y-cam.y,w,h)}
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x-cam.x,y-cam.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function text(t,x,y,size=14,color="#fff"){ctx.font=`${size}px system-ui`;ctx.fillStyle=color;ctx.fillText(t,x-cam.x,y-cam.y)}
function draw(){
 ctx.fillStyle="#173a22";ctx.fillRect(0,0,innerWidth,innerHeight);
 rect(150,840,2700,180,"#6f5a3e");rect(150,240,2700,115,"#665239");rect(150,1545,2700,115,"#665239");rect(1410,0,180,1900,"#665239");rect(2110,0,220,1900,"#174d62");
 trees.forEach(t=>{if(t.x>2070&&t.x<2350)return;circle(t.x,t.y,t.r,"#245c30");circle(t.x-3,t.y-3,t.r*.55,"#2e713b")});
 rect(250,650,430,480,"#3c3226");text("КРЕПОСТЬ ТЕНЕЙ",285,700,22,"#ffe39a");rect(2550,650,350,500,"#3b2020");text("ЦИТАДЕЛЬ ВРАГА",2580,700,18,"#ffaaaa");
 circle(510,820,17,"#ffd35a");text("Староста",470,790,13);circle(650,760,17,"#36d399");text("Торговец",610,730,13);
 towers.forEach(t=>{circle(t.x,t.y,25,t.team===1?"#68a9ff":"#ef5555")});buildings.forEach(t=>circle(t.x,t.y,24,"#e5c15d"));
 creeps.forEach(c=>{if(c.hp>0)circle(c.x,c.y,11,c.team===1?"#7aafff":"#ff7373")});
 enemies.forEach(e=>{if(e.dead)return;circle(e.x,e.y,e.r,e.boss?"#8d1830":"#b94540");if(e.boss)text("БОСС",e.x-23,e.y-42,13,"#ffc0c0");ctx.fillStyle="#1a1111";ctx.fillRect(e.x-e.r-cam.x,e.y-e.r-9-cam.y,e.r*2,4);ctx.fillStyle="#df5757";ctx.fillRect(e.x-e.r-cam.x,e.y-e.r-9-cam.y,e.r*2*(e.hp/e.maxhp),4)});
 circle(player.x,player.y,player.r,HEROES[selected].color);circle(player.x,player.y,7,"#eaf3ff");
}
function update(dt){
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x,dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joy.y,l=Math.hypot(dx,dy);
 if(l>.05){player.x+=dx/l*player.speed*dt;player.y+=dy/l*player.speed*dt;player.target=null}else if(player.target){let x=player.target.x-player.x,y=player.target.y-player.y,d=Math.hypot(x,y);if(d>8){player.x+=x/d*player.speed*dt;player.y+=y/d*player.speed*dt}else player.target=null}
 player.x=Math.max(20,Math.min(world.w-20,player.x));player.y=Math.max(20,Math.min(world.h-20,player.y));
 enemies.forEach(e=>{if(e.dead)return;let d=dist(e,player);if(!e.lane&&d<270&&d>35){e.x+=(player.x-e.x)/d*e.speed*dt;e.y+=(player.y-e.y)/d*e.speed*dt}if(d<38&&performance.now()-e.lastHit>900){e.lastHit=performance.now();player.hp-=e.dmg;if(player.hp<=0){player.hp=player.maxhp;player.mp=player.maxmp;player.x=610;player.y=940}}if(e.lane)e.x-=55*dt});
 creeps.forEach(c=>c.x+=60*dt);player.mp=Math.min(player.maxmp,player.mp+2.3*dt);
 cam.x=Math.max(0,Math.min(world.w-innerWidth,player.x-innerWidth/2));cam.y=Math.max(0,Math.min(world.h-innerHeight,player.y-innerHeight/2));
 hud.innerHTML=`<b>${HEROES[selected].name}</b> · LVL ${state.level} · XP ${state.xp}/100 · 💰 ${state.gold}<br>HP ${Math.floor(player.hp)}/${player.maxhp} · MP ${Math.floor(player.mp)}/${player.maxmp} · ATK ${player.atk}`;
 let qs=[`Поговори со Старостой [F]`,`Убей 5 врагов и вернись (${Math.min(state.kills,5)}/5)`,`Убей одного БОССА`,`Вернись к Старосте`,`Цепочка выполнена — исследуй мир, качайся и строй`];questEl.textContent="КВЕСТ: "+qs[state.quest];
}
function loop(t){let dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
function pickerUI(){heroesEl.className="heroRow";heroesEl.innerHTML="";Object.entries(HEROES).forEach(([k,h])=>{let b=document.createElement("button");b.className="hero";b.innerHTML=`<b style="color:${h.color}">${h.name}</b><small>HP ${h.hp} · MP ${h.mp} · ATK ${h.atk}<br>${h.skills}</small>`;b.onclick=()=>{applyHero(k,true);picker.style.display="none";started=true;save()};heroesEl.appendChild(b)});picker.style.display="flex"}
try{
 status.textContent="Подготавливаем мир…";prog.style.width="35%";load();setupWorld();prog.style.width="70%";applyHero(state.selected||"warrior",true);
 setTimeout(()=>{prog.style.width="100%";status.textContent="Готово";setTimeout(()=>{boot.style.display="none";pickerUI();requestAnimationFrame(loop);setInterval(spawnLane,4200);setInterval(save,2500)},250)},180);
}catch(e){window.onerror(e.message,"game.js",0,0,e)}
})();