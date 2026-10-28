import {englishPhrases} from './romance-source.js';
import {rows as basics} from './romance-theory.js';
import {rows as relativity} from './romance-relativity.js';
import {rows as clocks} from './romance-clocks.js';
import {rows as ui} from './romance-ui.js';
import {rows as extra} from './romance-extra.js';
import {rows as runtime} from './romance-runtime.js';
import {rows as notes} from './romance-notes.js';
import {phrases as runtimePhrases} from './romance-runtime-source.js';
import {phrases as notesPhrases} from './romance-notes-source.js';
const supported=['uk','en','it','es'];
let saved;try{saved=localStorage.getItem('gravity-language')||localStorage.getItem('inscience-language')}catch{}
const requested=new URLSearchParams(location.search).get('lang');
let selected=supported.includes(requested)?requested:supported.includes(saved)?saved:'uk';
export const getLanguage=()=>selected;
export const getLocale=()=>({uk:'uk-UA',en:'en-US',it:'it-IT',es:'es-ES'}[selected]);
export function setLanguage(value){selected=supported.includes(value)?value:'uk';try{localStorage.setItem('gravity-language',selected)}catch{}const url=new URL(location.href);url.searchParams.set('lang',selected);history.replaceState(null,'',url);document.documentElement.lang=selected;}
const tables={it:new Map(),es:new Map()};
for(const [rows,phrases] of [[runtime,runtimePhrases],[notes,notesPhrases]])for(const line of rows.split('\n')){const [id,it,es]=line.split('|');tables.it.set(phrases[Number(id)],it);tables.es.set(phrases[Number(id)],es)}
for(const line of [basics,relativity,clocks,ui].join('\n').split('\n')){const [id,it,es]=line.split('|');if(it===undefined||es===undefined)throw Error('Incomplete gravity translation: '+id);tables.it.set(englishPhrases[Number(id)],it);tables.es.set(englishPhrases[Number(id)],es)}
for(const line of extra.split('\n')){const [en,it,es]=line.split('|');if(it===undefined||es===undefined)throw Error('Incomplete translation: '+en);tables.it.set(en,it);tables.es.set(en,es)}
for(const table of Object.values(tables))for(const [key,value] of [...table])if(key.length>3)table.set(key.toUpperCase(),value.toUpperCase());
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+[...tables.it.keys()].sort((a,b)=>b.length-a.length).map(escapeRE).join('|')+')(?![\\p{L}_])','gu');
export const translate=value=>tables[selected]?(tables[selected].get(String(value))??String(value).replace(pattern,key=>tables[selected].get(key))):String(value);
const originals=new WeakMap(),attributes=new WeakMap();
function text(node){if(node.parentElement?.closest('textarea,script,style,[data-lang],#sourceList a'))return;const prior=originals.get(node),value=node.nodeValue,source=prior&&prior.output===value?prior.source:value,output=translate(source);originals.set(node,{source,output});if(value!==output)node.nodeValue=output;}
function element(el){if(el.closest('script,style'))return;let record=attributes.get(el);if(!record){record={};attributes.set(el,record)}for(const key of ['aria-label','title','placeholder','alt','aria-valuetext']){if(!el.hasAttribute(key))continue;const prior=record[key],value=el.getAttribute(key),source=prior&&prior.output===value?prior.source:value,output=translate(source);record[key]={source,output};if(value!==output)el.setAttribute(key,output)}if(el.matches('a[href]')){const raw=el.getAttribute('href');if(raw.includes('lang=')){const url=new URL(raw,location.href);if(url.origin===location.origin&&url.searchParams.get('lang')!==selected){url.searchParams.set('lang',selected);el.setAttribute('href',url.href)}}}}
export function localizeDOM(root=document.body){if(root.nodeType===3){text(root);return}if(root.nodeType!==1)return;element(root);const walk=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode;n.nodeType===3?text(n):element(n)}}
export function initLocalization(){const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')text(r.target);else if(r.type==='attributes')element(r.target);else for(const n of r.addedNodes)localizeDOM(n)}});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt','aria-valuetext','href']});localizeDOM();}
