(function(){
  var doc=document.documentElement;

  // Open or closed now, on UK time
  var H={0:[600,1020],1:null,2:[570,1110],3:[570,1110],4:[570,1110],5:[570,1110],6:[570,1110]};
  var DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function uk(){
    var f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
    var g=function(t){return f.find(function(p){return p.type===t}).value};
    return {d:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')),m:+g('hour')%24*60+ +g('minute')};
  }
  function fmt(m){var h=Math.floor(m/60),mm=m%60;return ((h+11)%12+1)+(mm?':'+String(mm).padStart(2,'0'):'')+(h>=12?' pm':' am')}
  function status(){
    var t=uk(),r=H[t.d],open=false,txt='',short='';
    if(r&&t.m>=r[0]&&t.m<r[1]){open=true;txt='Open now until '+fmt(r[1]);short='Open until '+fmt(r[1])}
    else{for(var i=0;i<8;i++){var d=(t.d+i)%7,rr=H[d];if(rr&&(i>0||t.m<rr[0])){var day=i===0?'today':i===1?'tomorrow':DAYS[d];txt='Closed now. Opens '+day+' at '+fmt(rr[0]);short='Opens '+(i<2?day:day.slice(0,3))+' '+fmt(rr[0]);break}}}
    document.querySelectorAll('.js-status').forEach(function(e){e.textContent=txt});
    document.querySelectorAll('.js-short').forEach(function(e){e.textContent=short});
    document.querySelectorAll('.js-dot').forEach(function(e){e.classList.toggle('off',!open)});
    document.querySelectorAll('.js-hours li').forEach(function(li){li.classList.toggle('today',+li.dataset.d===t.d)});
  }
  status();setInterval(status,60000);

  // Nav and phone book bar
  var nav=document.getElementById('nav'),sticky=document.getElementById('sticky');
  function onScroll(){var y=scrollY;nav.classList.toggle('solid',y>40);sticky.classList.toggle('on',y>innerHeight*.75&&y<document.documentElement.scrollHeight-innerHeight*1.6)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  // The ceiling: VIB's square lights, drawn in code
  var grid=document.querySelector('.js-grid'),stage=document.querySelector('.ceiling');
  for(var i=0;i<84;i++)grid.appendChild(document.createElement('i'));
  var period=0;
  function measure(){var a=grid.children[0],cols=getComputedStyle(grid).gridTemplateColumns.split(' ').length,b=grid.children[cols];period=b.offsetTop-a.offsetTop}
  measure();addEventListener('resize',measure);

  var rm=doc.classList.contains('rm');
  if(rm||!window.gsap){doc.classList.add('rm');grid.style.transform='translateY(-'+(period*.4)+'px)';return}

  function ceiling(){
    var r=stage.getBoundingClientRect(),span=r.height-innerHeight;
    if(r.bottom<0||r.top>innerHeight)return;
    var p=Math.min(1,Math.max(0,-r.top/span));
    grid.style.transform='translate3d(0,'+(-p*period*2.4).toFixed(1)+'px,0)';
  }
  addEventListener('scroll',ceiling,{passive:true});ceiling();

  gsap.registerPlugin(ScrollTrigger);
  var E='power4.out';
  var mm=gsap.matchMedia();

  // Smooth scroll on desktop only
  mm.add('(min-width:1024px) and (pointer:fine)',function(){
    if(!window.Lenis)return;
    var l=new Lenis({lerp:.1});l.on('scroll',ScrollTrigger.update);l.on('scroll',ceiling);
    var tick=function(t){l.raf(t*1000)};gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();l.scrollTo(t,{offset:-64})}})});
    return function(){gsap.ticker.remove(tick);l.destroy()};
  });

  // Hero: the headline leads, the frame draws round it like the logo
  var tl=gsap.timeline({defaults:{ease:E}});
  tl.fromTo('.hero .ph img',{scale:1.06},{scale:1,duration:1.6,ease:'power2.out'},0)
    .to('.hero h1 .ln>span',{y:0,duration:.9,stagger:.11},0)
    .to('.hero .frame .t',{scaleX:1,duration:1},.12)
    .to('.hero .frame .l,.hero .frame .r',{scaleY:1,duration:1},.12)
    .to('.hero .fade',{opacity:1,y:0,duration:.7,stagger:.08},.3)
    .to('.hero .frame .bl,.hero .frame .br',{scaleX:1,duration:.8},.52)
    .to('.hero .frame .cap',{opacity:1,duration:.6,ease:'power2.out'},.52);

  // Reveals, once, in page order
  ScrollTrigger.batch('.rv',{start:'top 92%',once:true,onEnter:function(b){gsap.to(b,{opacity:1,y:0,duration:.7,ease:E,stagger:.05,overwrite:true})}});

  // Shop photos open from the middle
  gsap.utils.toArray('.gal figure').forEach(function(f){
    gsap.to(f,{clipPath:'inset(0% 0% 0% 0%)',duration:1.1,ease:E,scrollTrigger:{trigger:f,start:'top 94%',once:true}});
  });

  // Footer lockup draws once, same as the hero frame
  var lt=gsap.timeline({defaults:{ease:E},scrollTrigger:{trigger:'.logo',start:'top 85%',once:true}});
  lt.from('.logo .t',{scaleX:0,duration:1})
    .from('.logo .l,.logo .r',{scaleY:0,duration:1},0)
    .from('.logo .vib',{opacity:0,y:24,duration:.9},.1)
    .from('.logo .strike',{scaleX:0,duration:.9},.35)
    .from('.logo .bl,.logo .br',{scaleX:0,duration:.7},.45)
    .from('.logo .tag',{opacity:0,duration:.6,ease:'power2.out'},.5);

  addEventListener('load',function(){measure();ScrollTrigger.refresh();ceiling()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){ScrollTrigger.refresh()});
})();
