
const WW=3000,WH=1900;
const HEROES={
 Warrior:{name:"Воин",color:0x4ea5ff,hp:150,mp:80,atk:24,speed:205,skills:["Рывок","Вихрь","Боевой клич","Казнь"]},
 Mage:{name:"Маг",color:0xb06cff,hp:95,mp:180,atk:19,speed:200,skills:["Огненный шар","Ледяная nova","Телепорт","Метеор"]},
 Ranger:{name:"Следопыт",color:0x55d47b,hp:110,mp:120,atk:22,speed:230,skills:["Выстрел","Ловушка","Ускорение","Град стрел"]}
};
class Game extends Phaser.Scene{
 constructor(){super("Game")}
 create(){
  this.sel="Warrior";this.level=1;this.xp=0;this.gold=250;this.quest=0;this.kills=0;this.inv=["Зелье здоровья","Зелье маны","Свиток возврата"];this.equip={weapon:"Ржавый меч",armor:"Кожаная броня"};this.talents=0;this.buildMode=false;this.buildings=[];this.started=false;
  this.drawWorld();this.enemies=this.physics.add.group();this.allies=this.physics.add.group();this.towers=this.physics.add.staticGroup();
  this.createHero(610,940);this.spawnWorld();this.makeHUD();this.makeMobile();this.bindKeys();this.load();
  this.cameras.main.startFollow(this.player,true,.08,.08);this.cameras.main.setBounds(0,0,WW,WH);this.physics.world.setBounds(0,0,WW,WH);
  this.time.addEvent({delay:1700,loop:true,callback:()=>this.spawnLaneCreeps()});
  this.time.addEvent({delay:2500,loop:true,callback:()=>this.save()});
  this.showHeroPicker();
 }
 drawWorld(){
  this.add.rectangle(WW/2,WH/2,WW,WH,0x183720);
  this.add.rectangle(1500,950,2700,180,0x6e5a3d).setAngle(-2);
  this.add.rectangle(1500,300,2700,120,0x66543a);
  this.add.rectangle(1500,1600,2700,120,0x66543a);
  this.add.rectangle(1500,950,180,WH,0x66543a);
  this.add.rectangle(2200,950,220,WH,0x174c62);
  this.add.rectangle(440,930,550,500,0x3e3427).setStrokeStyle(8,0x17130f);
  this.add.text(270,650,"КРЕПОСТЬ ТЕНЕЙ",{fontSize:"24px",color:"#ffe29a"});
  for(let i=0;i<130;i++){let x=Phaser.Math.Between(50,WW-50),y=Phaser.Math.Between(50,WH-50);if(x>2080&&x<2320)continue;this.add.circle(x,y,Phaser.Math.Between(10,24),0x245b30).setStrokeStyle(2,0x102d17)}
  this.add.rectangle(2700,950,420,520,0x3c2020).setStrokeStyle(8,0x1c0b0b);this.add.text(2580,650,"ЦИТАДЕЛЬ ВРАГА",{fontSize:"22px",color:"#ff9b9b"});
  this.add.text(1130,105,"СЕВЕРНАЯ ЛИНИЯ",{fontSize:"16px"});this.add.text(1130,1730,"ЮЖНАЯ ЛИНИЯ",{fontSize:"16px"});
 }
 createHero(x,y){
  let h=HEROES[this.sel];this.maxhp=h.hp;this.hp=h.hp;this.maxmp=h.mp;this.mp=h.mp;this.atk=h.atk;
  if(this.player)this.player.destroy();
  this.player=this.physics.add.sprite(x,y,null).setDisplaySize(38,38).setTint(h.color).setCollideWorldBounds(true);this.player.body.setCircle(18);
 }
 spawnWorld(){
  for(let i=0;i<38;i++)this.spawnEnemy(Phaser.Math.Between(950,2750),Phaser.Math.Between(180,1720),false);
  this.spawnEnemy(2520,450,true);this.spawnEnemy(2550,1450,true);
  this.npc=this.physics.add.staticSprite(510,820,null).setDisplaySize(32,32).setTint(0xffd35a);this.add.text(468,775,"Староста",{fontSize:"14px",backgroundColor:"#0009"});
  this.shop=this.physics.add.staticSprite(650,760,null).setDisplaySize(34,34).setTint(0x36d399);this.add.text(608,715,"Торговец",{fontSize:"14px",backgroundColor:"#0009"});
  [[850,300],[1450,300],[850,1600],[1450,1600]].forEach(([x,y])=>{let t=this.towers.create(x,y,null).setDisplaySize(48,48).setTint(0x60a5fa);t.team=1});
  [[2450,300],[2700,300],[2450,1600],[2700,1600]].forEach(([x,y])=>{let t=this.towers.create(x,y,null).setDisplaySize(48,48).setTint(0xef4444);t.team=2});
 }
 spawnEnemy(x,y,boss=false){let e=this.enemies.create(x,y,null).setDisplaySize(boss?68:30,boss?68:30).setTint(boss?0x9b1c31:0xc34b43);e.hp=boss?500:55;e.maxhp=e.hp;e.dmg=boss?18:7;e.speed=boss?55:75;e.boss=boss;e.last=0;if(boss)this.add.text(x-48,y-55,"БОСС",{fontSize:"15px",color:"#ffb3b3"});return e}
 spawnLaneCreeps(){
  if(this.enemies.countActive(true)>70)return;
  [300,1600].forEach(y=>{let a=this.allies.create(700,y,null).setDisplaySize(22,22).setTint(0x72a7ff);a.hp=35;a.team=1;a.setVelocityX(70);let e=this.spawnEnemy(2600,y,false);e.lane=true;e.setVelocityX(-60)});
 }
 bindKeys(){this.keys=this.input.keyboard.addKeys("W,A,S,D,Q,E,R,F,I,T,B,ONE,TWO,THREE");this.cursors=this.input.keyboard.createCursorKeys();this.input.on("pointerdown",p=>{if(!p.wasTouch&&this.started)this.target=this.cameras.main.getWorldPoint(p.x,p.y)})}
 makeHUD(){
  this.hud=this.add.text(10,10,"",{fontSize:"13px",backgroundColor:"#000c",padding:{x:10,y:8}}).setScrollFactor(0).setDepth(50);
  this.qtxt=this.add.text(10,92,"",{fontSize:"12px",backgroundColor:"#000a",padding:{x:8,y:6}}).setScrollFactor(0).setDepth(50);
  this.help=this.add.text(10,145,"F NPC/магазин • I инвентарь • T талант • B строительство • QWER способности",{fontSize:"11px",backgroundColor:"#0008",padding:{x:7,y:5}}).setScrollFactor(0).setDepth(50);
  this.panel=this.add.text(10,180,"",{fontSize:"12px",backgroundColor:"#081018ee",padding:{x:10,y:8}}).setScrollFactor(0).setDepth(60).setVisible(false);
 }
 showHeroPicker(){
  this.started=false;let bg=this.add.rectangle(this.scale.width/2,this.scale.height/2,Math.min(760,this.scale.width-30),360,0x070b10,.96).setScrollFactor(0).setDepth(100);
  let title=this.add.text(this.scale.width/2,this.scale.height/2-145,"ВЫБЕРИ ГЕРОЯ",{fontSize:"28px"}).setOrigin(.5).setScrollFactor(0).setDepth(101);
  let objs=[bg,title];
  ["Warrior","Mage","Ranger"].forEach((k,i)=>{let h=HEROES[k],x=this.scale.width/2-220+i*220,y=this.scale.height/2;let c=this.add.circle(x,y,55,h.color).setScrollFactor(0).setDepth(101).setInteractive();let t=this.add.text(x,y+75,h.name+"\n"+h.skills.join("\n"),{fontSize:"13px",align:"center"}).setOrigin(.5,0).setScrollFactor(0).setDepth(101);objs.push(c,t);c.on("pointerdown",()=>{this.sel=k;let pos={x:this.player.x,y:this.player.y};this.createHero(pos.x,pos.y);this.cameras.main.startFollow(this.player,true,.08,.08);objs.forEach(o=>o.destroy());this.started=true})});
 }
 makeMobile(){
  if(!this.sys.game.device.input.touch)return;this.joy={x:0,y:0};
  let y=()=>this.scale.height-95,base=this.add.circle(95,y(),58,0x000000,.35).setScrollFactor(0).setDepth(70).setInteractive(),knob=this.add.circle(95,y(),24,0xffffff,.3).setScrollFactor(0).setDepth(71);
  const mv=p=>{let dx=p.x-95,dy=p.y-y(),l=Math.max(1,Math.hypot(dx,dy)),m=Math.min(48,l);knob.setPosition(95+dx/l*m,y()+dy/l*m);this.joy={x:dx/l*(l>10),y:dy/l*(l>10)}};
  base.on("pointerdown",mv);this.input.on("pointermove",p=>{if(p.isDown&&p.x<210)mv(p)});this.input.on("pointerup",()=>{this.joy={x:0,y:0};knob.setPosition(95,y())});
  [["Q",70],["W",140],["E",210],["R",280]].forEach(([k,o])=>{let x=this.scale.width-o,b=this.add.circle(x,y(),27,0x263b65,.9).setScrollFactor(0).setDepth(70).setInteractive();this.add.text(x-8,y()-11,k,{fontSize:"18px"}).setScrollFactor(0).setDepth(71);b.on("pointerdown",()=>this.cast(k))});
  [["F",55,170],["I",115,170],["B",175,170]].forEach(([k,o,up])=>{let x=this.scale.width-o,yy=this.scale.height-up,b=this.add.circle(x,yy,22,0x80651e,.9).setScrollFactor(0).setDepth(70).setInteractive();this.add.text(x-6,yy-9,k,{fontSize:"15px"}).setScrollFactor(0).setDepth(71);b.on("pointerdown",()=>k==="F"?this.interact():k==="I"?this.toggleInventory():this.toggleBuild())});
 }
 cast(k){
  if(!this.started)return;let costs={Q:10,W:15,E:18,R:35};if(this.mp<costs[k])return;this.mp-=costs[k];
  let r=k==="R"?330:240,targets=this.nearEnemies(r),mult={Q:1.1,W:.9,E:.75,R:2.6}[k];
  if(k==="E"&&this.sel==="Warrior")this.hp=Math.min(this.maxhp,this.hp+20);
  if(k==="E"&&this.sel==="Mage"){let p=this.closestEnemy(400);if(p)this.player.setPosition(p.x-80,p.y)}
  targets.slice(0,k==="R"?8:(k==="W"?4:1)).forEach(e=>this.damage(e,Math.round(this.atk*mult)));
 }
 nearEnemies(r){return this.enemies.getChildren().filter(e=>e.active&&Phaser.Math.Distance.Between(this.player.x,this.player.y,e.x,e.y)<r).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y))}
 closestEnemy(r){return this.nearEnemies(r)[0]}
 damage(e,d){e.hp-=d;this.tweens.add({targets:e,alpha:.25,yoyo:true,duration:70});if(e.hp<=0){this.gold+=e.boss?120:10;this.xp+=e.boss?90:15;this.kills++;if(e.boss&&this.quest===2)this.quest=3;e.destroy();while(this.xp>=100){this.xp-=100;this.level++;this.talents++;this.maxhp+=8;this.hp=this.maxhp;this.atk+=3}}}
 interact(){
  if(Phaser.Math.Distance.Between(this.player.x,this.player.y,this.npc.x,this.npc.y)<90){if(this.quest===0)this.quest=1;else if(this.quest===1&&this.kills>=5)this.quest=2;else if(this.quest===3){this.quest=4;this.gold+=300;this.inv.push("Клинок Стража");this.equip.weapon="Клинок Стража";this.atk+=12}}
  else if(Phaser.Math.Distance.Between(this.player.x,this.player.y,this.shop.x,this.shop.y)<90){if(this.gold>=50){this.gold-=50;this.inv.push("Большое зелье")}}
 }
 toggleInventory(){this.panel.setVisible(!this.panel.visible);this.panel.setText("ИНВЕНТАРЬ / ЭКИПИРОВКА\nОружие: "+this.equip.weapon+"\nБроня: "+this.equip.armor+"\n\n"+this.inv.map((x,i)=>`${i+1}. ${x}`).join("\n"))}
 talent(){if(this.talents>0){this.talents--;this.atk+=5;this.maxhp+=10;this.hp+=10}}
 toggleBuild(){this.buildMode=!this.buildMode;if(this.buildMode&&this.gold>=100){this.gold-=100;let t=this.towers.create(this.player.x+70,this.player.y,null).setDisplaySize(42,42).setTint(0xf0c75e);t.team=1;this.buildings.push({x:t.x,y:t.y})}}
 update(){
  if(!this.started)return;let dx=(this.keys.D.isDown||this.cursors.right.isDown?1:0)-(this.keys.A.isDown||this.cursors.left.isDown?1:0),dy=(this.keys.S.isDown||this.cursors.down.isDown?1:0)-(this.keys.W.isDown||this.cursors.up.isDown?1:0);if(this.joy){dx+=this.joy.x;dy+=this.joy.y}
  let v=new Phaser.Math.Vector2(dx,dy);if(v.length()){v.normalize().scale(HEROES[this.sel].speed);this.player.setVelocity(v.x,v.y);this.target=null}else if(this.target){let d=new Phaser.Math.Vector2(this.target.x-this.player.x,this.target.y-this.player.y);if(d.length()>10){d.normalize().scale(HEROES[this.sel].speed);this.player.setVelocity(d.x,d.y)}else{this.player.setVelocity(0);this.target=null}}else this.player.setVelocity(0);
  ["Q","W","E","R"].forEach(k=>{if(Phaser.Input.Keyboard.JustDown(this.keys[k]))this.cast(k)});if(Phaser.Input.Keyboard.JustDown(this.keys.F))this.interact();if(Phaser.Input.Keyboard.JustDown(this.keys.I))this.toggleInventory();if(Phaser.Input.Keyboard.JustDown(this.keys.T))this.talent();if(Phaser.Input.Keyboard.JustDown(this.keys.B))this.toggleBuild();
  this.enemies.getChildren().forEach(e=>{if(!e.active)return;let d=Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y);if(!e.lane&&d<280&&d>35)this.physics.moveToObject(e,this.player,e.speed);if(d<40&&this.time.now-e.last>900){e.last=this.time.now;this.hp-=e.dmg;if(this.hp<=0){this.hp=this.maxhp;this.mp=this.maxmp;this.player.setPosition(610,940)}}});
  this.allies.getChildren().forEach(a=>{let e=this.enemies.getChildren().find(x=>x.active&&Phaser.Math.Distance.Between(a.x,a.y,x.x,x.y)<35);if(e){a.setVelocity(0);if(!a.last||this.time.now-a.last>800){a.last=this.time.now;e.hp-=5;if(e.hp<=0)e.destroy()}}});
  this.mp=Math.min(this.maxmp,this.mp+.04);
  this.hud.setText(`${HEROES[this.sel].name} • LVL ${this.level} • XP ${this.xp}/100 • талантов ${this.talents}\nHP ${Math.floor(this.hp)}/${this.maxhp}  MP ${Math.floor(this.mp)}/${this.maxmp}  ATK ${this.atk}  GOLD ${this.gold}`);
  let qs=["Поговори со Старостой [F]","Убей 5 врагов и вернись ("+Math.min(this.kills,5)+"/5)","Убей одного БОССА","Вернись к Старосте","Основная цепочка завершена — исследуй, строй и качайся"][this.quest];this.qtxt.setText("КВЕСТ: "+qs);
 }
 save(){if(!this.started)return;localStorage.setItem("sf-full",JSON.stringify({sel:this.sel,x:this.player.x,y:this.player.y,level:this.level,xp:this.xp,gold:this.gold,quest:this.quest,kills:this.kills,inv:this.inv,equip:this.equip,talents:this.talents,atk:this.atk,maxhp:this.maxhp,hp:this.hp,maxmp:this.maxmp,mp:this.mp}))}
 load(){try{let s=JSON.parse(localStorage.getItem("sf-full"));if(s){Object.assign(this,s);this.createHero(s.x,s.y);Object.assign(this,{level:s.level,xp:s.xp,gold:s.gold,quest:s.quest,kills:s.kills,inv:s.inv,equip:s.equip,talents:s.talents,atk:s.atk,maxhp:s.maxhp,hp:s.hp,maxmp:s.maxmp,mp:s.mp})}}catch(e){}}
}
new Phaser.Game({type:Phaser.AUTO,parent:"game",width:1280,height:720,backgroundColor:"#08100b",physics:{default:"arcade",arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Game});
