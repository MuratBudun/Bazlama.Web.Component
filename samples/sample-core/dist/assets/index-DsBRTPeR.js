var J=Object.defineProperty;var Y=(i,e,t)=>e in i?J(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var p=(i,e,t)=>Y(i,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();var Z=Object.defineProperty,ee=(i,e,t)=>e in i?Z(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t,l=(i,e,t)=>ee(i,typeof e!="symbol"?e+"":e,t);class f{static anyToString(e,t=""){if(e==null)return t;switch(typeof e){case"string":return e;case"number":return e.toString();case"bigint":return e.toString();case"boolean":return e?"true":"false";case"object":return JSON.stringify(e)}return t}static anyToNumber(e,t=0,o=4){if(e==null)return t;switch(typeof e){case"string":{const n=parseFloat(e);return isNaN(n)?t:parseFloat(n.toFixed(o))}case"number":return parseFloat(e.toFixed(o));case"bigint":return Number(e);case"boolean":return e?1:0}return t}static anyToBoolean(e,t=!1){if(e==null)return t;switch(typeof e){case"string":{const o=e.toLowerCase().trim();return o==="true"||o==="1"||o==="yes"||o==="on"||o==="ok"||o==="evet"||o==="doğru"}case"number":return e===1;case"bigint":return e===1n;case"boolean":return e}return t}static anyToBigint(e,t=BigInt(0)){if(e==null)return t;switch(typeof e){case"string":try{return BigInt(e)}catch{return t}case"number":return BigInt(Math.floor(e));case"bigint":return e;case"boolean":return e?1n:0n}return t}static remToPx(e,t=0){if(e==null)return t;const o=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;return parseFloat((e*o).toFixed(4))}static pxToRem(e,t=0){if(e==null)return t;const o=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;return parseFloat((e/o).toFixed(4))}static remToPt(e,t=0){if(e==null)return t;const o=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;return parseFloat((e*o*.75).toFixed(4))}static ptToRem(e,t=0){if(e==null)return t;const o=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;return parseFloat((e/o/.75).toFixed(4))}static remToEm(e,t=0){if(e==null)return t;const o=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;return parseFloat((e*o/16).toFixed(4))}static emToRem(e,t=0){if(e==null)return t;const o=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;return parseFloat((e*16/o).toFixed(4))}static pxToPt(e,t=0){return e==null?t:parseFloat((e*.75).toFixed(4))}static ptToPx(e,t=0){return e==null?t:parseFloat((e/.75).toFixed(4))}static pxToEm(e,t=0){return e==null?t:parseFloat((e/16).toFixed(4))}static emToPx(e,t=0){return e==null?t:parseFloat((e*16).toFixed(4))}static ptToEm(e,t=0){return e==null?t:parseFloat((e/12).toFixed(4))}static emToPt(e,t=0){return e==null?t:parseFloat((e*12).toFixed(4))}}class S extends Error{constructor(e,t){super(`[Bazlama] ${e}`),l(this,"context"),l(this,"timestamp"),this.name="BazlamaError",this.context=t,this.timestamp=new Date,Error.captureStackTrace&&Error.captureStackTrace(this,S)}toString(){let e=this.message;if(this.context){const t=[];this.context.componentName&&t.push(`Component: ${this.context.componentName}`),this.context.propertyName&&t.push(`Property: ${this.context.propertyName}`),this.context.decoratorName&&t.push(`Decorator: ${this.context.decoratorName}`),this.context.methodName&&t.push(`Method: ${this.context.methodName}`),t.length>0&&(e+=` (${t.join(", ")})`)}return e}}class D extends S{constructor(e,t){super(e,t),this.name="BazlamaDecoratorError"}}class q extends S{constructor(e,t){super(e,t),this.name="BazlamaPropertyError"}}function te(i,e){const t=new S(i,e);console.warn(t.toString())}const M=new WeakMap;function T(i,e){if(!i.root)return[];let t=M.get(i);t||(t=new Map,M.set(i,t));let o=t.get(e);return o||(o=Array.from(i.root.querySelectorAll(e)),t.set(e,o)),o}function oe(i){M.delete(i)}var V=(i=>(i.None="none",i.Open="open",i.Closed="closed",i))(V||{});class ne{constructor(e,t,o,n){l(this,"name"),l(this,"elQuery"),l(this,"eventName"),l(this,"actionMethod"),this.name=e,this.elQuery=t,this.eventName=o,this.actionMethod=n}CreateElementEvent(e){var t;const o=(t=e.root)==null?void 0:t.querySelectorAll(this.elQuery);o&&o.forEach(n=>{const r=s=>{this.actionMethod(this.name,n,this.eventName,s)};n.addEventListener(this.eventName,r),e.registerCleanup(()=>{n.removeEventListener(this.eventName,r)})})}}class R{constructor(e,t={}){l(this,"valueTypeName"),l(this,"defaultValue"),l(this,"name"),l(this,"isAttribute"),l(this,"isAttributeObserved"),l(this,"attributeName"),l(this,"isFireRenderOnChanged"),l(this,"isFireEventOnChanged"),l(this,"changeHooks"),this.name=e,this.defaultValue=t.defaultValue||"",this.valueTypeName=t.valueTypeName||"string",this.isAttribute=t.isAttribute||!1,this.isAttributeObserved=t.isAttributeObserved||!1,this.attributeName=t.attributeName||e,this.isFireRenderOnChanged=t.isFireRenderOnChanged||!1,this.isFireEventOnChanged=t.isFireEventOnChanged||!1,this.changeHooks=t.changeHooks||[]}getValue(e){if(!(e instanceof d))return this.defaultValue;const t=e.propertyValues[this.name];return t===void 0?this.defaultValue:this.valueTypeName==="string"?f.anyToString(t,f.anyToString(this.defaultValue)):this.valueTypeName==="number"?f.anyToNumber(t,f.anyToNumber(this.defaultValue)):this.valueTypeName==="boolean"?f.anyToBoolean(t,f.anyToBoolean(this.defaultValue)):this.valueTypeName==="bigint"?f.anyToBigint(t,f.anyToBigint(this.defaultValue)):t}setValue(e,t){if(!(e instanceof d))return;this.setAttributeValue(e,t)===!1&&this.setDirectValue(e,t)}setAttributeValue(e,t){if(!(e instanceof d)||!this.isAttribute)return!1;const o=this.attributeName||this.name;if(!o)return!1;if(t==null)return e.removeAttribute(o),!1;const n=f.anyToString(t);return e.setAttribute(o,String(n)),!0}setDirectValue(e,t,o=!1){if(!(e instanceof d))return;const n=e.propertyValues[this.name];switch(this.valueTypeName){case"string":e.propertyValues[this.name]=f.anyToString(t,f.anyToString(this.defaultValue));break;case"number":e.propertyValues[this.name]=f.anyToNumber(t,f.anyToNumber(this.defaultValue));break;case"boolean":e.propertyValues[this.name]=f.anyToBoolean(t,f.anyToBoolean(this.defaultValue));break;case"bigint":e.propertyValues[this.name]=f.anyToBigint(t,f.anyToBigint(this.defaultValue));break;default:e.propertyValues[this.name]=t;break}if(this.changeHooks.forEach(r=>r(e,t,this,n)),this.isFireRenderOnChanged&&o===!1&&e.isRendered===!0&&e.render(),this.isFireEventOnChanged){const r={bazComponent:e,name:this.name,value:t,oldValue:n};e.dispatchEvent(new CustomEvent("property-changed",{detail:r})),e.dispatchEvent(new CustomEvent(this.name+"-changed",{detail:r}))}}}class d extends HTMLElement{constructor(e=V.Closed){super(),l(this,"isDomConnected",!1),l(this,"isRendered",!1),l(this,"propertyValues",{}),l(this,"eventActionMaps",{}),l(this,"root",null),l(this,"isNoRenderedComponent",!1),l(this,"_eventCleanupFunctions",[]),this.style.display="block",this.root=this,e===V.Open&&(this.attachShadow({mode:"open"}),this.root=this.shadowRoot||this),e===V.Closed&&(this.root=this.attachShadow({mode:"closed"})||this)}render(){if(this.isNoRenderedComponent)return;oe(this);const e=this.beforeRender(this.getRenderTemplate());this.root&&(this.root.innerHTML=e),this.isRendered=!0,this.ApplyAllPropertyChangeHooks(),this.CreateHtmlElementEventActions(),this.afterRender()}InitBazlamaWebComponent(){this.InitProperties();const e=this.createEventActionMaps();e&&Array.isArray(e)&&e.length>0&&e.forEach(t=>{this.eventActionMaps[t.name]=t}),this.InitEventActionDecorators()}InitProperties(){const e=this.getConstructor();if(!e.PropertyDefinesIsNullOrEmpty){for(const t in e.PropertyDefines)if(Object.prototype.hasOwnProperty.call(e.PropertyDefines,t)){const o=e.PropertyDefines[t];o instanceof R&&this.InitProperty(o)}}}InitProperty(e){let t=e.defaultValue;Object.keys(this).includes(e.name)&&(t=this[e.name],e.valueTypeName=typeof t,e.defaultValue=t),this.propertyValues[e.name]=t,Object.defineProperty(this,e.name,{get(){return this.propertyValues[e.name]},set(o){this.getConstructor().GetPropertyDefine(e.name).setValue(this,o)}})}ApplyAllPropertyChangeHooks(){const e=this.getConstructor();if(!e.PropertyDefinesIsNullOrEmpty){for(const t in e.PropertyDefines)if(Object.prototype.hasOwnProperty.call(e.PropertyDefines,t)){const o=e.PropertyDefines[t];if(o instanceof R){const n=o.getValue(this);o.changeHooks.forEach(r=>r(this,n,o,n))}}}}GetPropertyValue(e){return this.propertyValues[e]}SetPropertyValue(e,t){const o=this.getConstructor().GetPropertyDefine(e);o&&o.setValue(this,t)}InitEventActionDecorators(){const e=this.getConstructor();if(e.EventActionDefines){for(const t in e.EventActionDefines)if(Object.prototype.hasOwnProperty.call(e.EventActionDefines,t)){const o=e.EventActionDefines[t],n=this[o.actionMethodName];if(!n){te(`Event method not found: ${o.actionMethodName}`,{componentName:this.constructor.name,methodName:o.actionMethodName});continue}const r=n.bind(this),s=new ne(o.name,o.elQuery,o.eventName,r);this.eventActionMaps[o.name]=s}}}CreateHtmlElementEventActions(){for(const e in this.eventActionMaps)Object.prototype.hasOwnProperty.call(this.eventActionMaps,e)&&this.eventActionMaps[e].CreateElementEvent(this)}static getStaticStorage(){return this}static get isPropertyDefineInitialized(){const e=this.getStaticStorage();return e._isPropertyDefineInitialized===void 0&&(e._isPropertyDefineInitialized=!1),e._isPropertyDefineInitialized}static set isPropertyDefineInitialized(e){this.getStaticStorage()._isPropertyDefineInitialized=e}static get PropertyDefines(){const e=this.getStaticStorage();return e._PropertyDefines===void 0&&(e._PropertyDefines={}),e._PropertyDefines}static get EventActionDefines(){const e=this.getStaticStorage();return e._EventActionDefines===void 0&&(e._EventActionDefines={}),e._EventActionDefines}static get PropertyChangeHandlers(){const e=this.getStaticStorage();return e._PropertyChangeHandlers===void 0&&(e._PropertyChangeHandlers={}),e._PropertyChangeHandlers}static InitPropertyDefines(){const e=this.CreatePropertyDefines(),t=this.CreatePropertyHooks();if(e&&Array.isArray(e)&&e.length>0&&e.forEach(o=>{this.HasPropertyDefine(o.name)?(this.PropertyDefines[o.name].isAttribute=o.isAttribute,this.PropertyDefines[o.name].attributeName=o.attributeName,this.PropertyDefines[o.name].isAttributeObserved=o.isAttributeObserved,this.PropertyDefines[o.name].changeHooks=[...this.PropertyDefines[o.name].changeHooks,...o.changeHooks]):this.PropertyDefines[o.name]=o}),t){for(const o in this.PropertyDefines)if(Object.prototype.hasOwnProperty.call(this.PropertyDefines,o)){const n=this.PropertyDefines[o];t[n.name]&&(n.changeHooks=[...n.changeHooks,...t[n.name]])}}}static CreatePropertyDefines(){return[]}static CreatePropertyHooks(){return{}}static get PropertyDefinesIsNullOrEmpty(){return!this.PropertyDefines||Object.keys(this.PropertyDefines).length===0}static HasPropertyDefine(e,t=!1){if(this.PropertyDefinesIsNullOrEmpty)return!1;const o=t===!0,n=this.PropertyDefines[e];return n?o?n.isAttribute:!0:!1}static GetPropertyDefine(e,t=!1){if(this.PropertyDefinesIsNullOrEmpty)return null;const o=t===!0,n=this.PropertyDefines[e];return n&&(!o||n.isAttribute)?n:null}static GetPropertyDefineByAttributeName(e){if(this.PropertyDefinesIsNullOrEmpty)return null;for(const t in this.PropertyDefines)if(Object.prototype.hasOwnProperty.call(this.PropertyDefines,t)){const o=this.PropertyDefines[t];if(o.attributeName===e)return o}return null}static get observedAttributes(){return this.isPropertyDefineInitialized===!1&&(this.InitPropertyDefines(),this.isPropertyDefineInitialized=!0),this.PropertyDefinesIsNullOrEmpty?[]:Object.values(this.PropertyDefines).filter(t=>t.isAttribute).map(t=>t.attributeName)}getConstructor(){return this.constructor}attributeChangedCallback(e,t,o){if(t===o)return;const n=this.getConstructor().GetPropertyDefineByAttributeName(e);n&&n.setDirectValue(this,o??"")}connectedCallback(){this.isDomConnected=!0,this.isRendered=!1,this.InitBazlamaWebComponent(),this.onConnected(),this.render()}disconnectedCallback(){this.cleanupEventListeners(),this.isDomConnected=!1,this.isRendered=!1,this.onDisconnected()}cleanupEventListeners(){this._eventCleanupFunctions.forEach(e=>e()),this._eventCleanupFunctions=[]}registerCleanup(e){this._eventCleanupFunctions.push(e)}onConnected(){}onDisconnected(){}getRenderTemplate(){return"<span>Not implemented.</span>"}beforeRender(e){return e}afterRender(){}createEventActionMaps(){return[]}}function b(i){return function(e){customElements.define(i,e)}}function u(i={}){return function(e,t){if(!(e instanceof d))throw new D("Target is not BazlamaWebComponent",{decoratorName:"Property",propertyName:t});const n=e.getConstructor();if(n.HasPropertyDefine(t)){n.PropertyDefines[t].isAttribute=i.isAttribute||!1,n.PropertyDefines[t].attributeName=i.attributeName||"",n.PropertyDefines[t].isAttributeObserved=i.isAttributeObserved||!1,n.PropertyDefines[t].isFireRenderOnChanged=i.isFireRenderOnChanged||!1,n.PropertyDefines[t].changeHooks=[...n.PropertyDefines[t].changeHooks,...i.changeHooks||[]];return}const r=new R(t,i);n.PropertyDefines[t]=r}}function m(i,e=!1,t=!1,o=!1){return function(n,r){if(!(n instanceof d))throw new D("Target is not BazlamaWebComponent",{decoratorName:"Attribute",propertyName:r});const a=n.getConstructor();if(a.HasPropertyDefine(r)){a.PropertyDefines[r].isAttribute=!0,a.PropertyDefines[r].attributeName=i,a.PropertyDefines[r].isAttributeObserved=e,a.PropertyDefines[r].isFireRenderOnChanged=t,a.PropertyDefines[r].isFireEventOnChanged=o,a.PropertyDefines[r].changeHooks=[...a.PropertyDefines[r].changeHooks];return}const h=new R(r,{isAttribute:!0,attributeName:i,isAttributeObserved:e,isFireRenderOnChanged:t,isFireEventOnChanged:o});a.PropertyDefines[r]=h}}function _(i){return function(e,t){if(!(e instanceof d))throw new D("Target is not BazlamaWebComponent",{decoratorName:"ChangeHooks",propertyName:t});const n=e.getConstructor();if(n.HasPropertyDefine(t)){n.PropertyDefines[t].changeHooks=[...n.PropertyDefines[t].changeHooks,...i||[]];return}throw new q("PropertyDefine not found",{decoratorName:"ChangeHooks",propertyName:t,componentName:n.name})}}function c(i,e){return function(t,o){if(!(t instanceof d))throw new D("Target is not BazlamaWebComponent",{decoratorName:"EventAction",propertyName:o,additionalInfo:{eventName:e}});const n=t,r={name:o,elQuery:i,eventName:e,actionMethodName:o},s=n.getConstructor();s.EventActionDefines[o]=r}}function re(){return function(i,e){if(!(i instanceof d))throw new D("Target is not BazlamaWebComponent",{decoratorName:"FireEvent",propertyName:e});const o=i.getConstructor();if(o.HasPropertyDefine(e)){o.PropertyDefines[e].isFireEventOnChanged=!0;return}throw new q("PropertyDefine not found",{decoratorName:"FireEvent",propertyName:e,componentName:o.name})}}function ie(){return function(i,e){if(!(i instanceof d))throw new D("Target is not BazlamaWebComponent",{decoratorName:"FireRender",propertyName:e});const o=i.getConstructor();if(o.HasPropertyDefine(e)){o.PropertyDefines[e].isFireRenderOnChanged=!0;return}throw new q("PropertyDefine not found",{decoratorName:"FireRender",propertyName:e,componentName:o.name})}}function se(i,e,t){return(o,n)=>{T(o,i).forEach(s=>{s.setAttribute(e,`${n}`)})}}function ae(i){return(e,t,o)=>{T(e,i).forEach(r=>{r instanceof HTMLInputElement&&(r.oninput||(r.oninput=s=>{o&&o.setValue(e,s.target.value)}),r.value=t)})}}function K(i,e,t="",o="",n){return(r,s)=>{const a=T(r,i),h=s;a.forEach(F=>{F.style.setProperty(e,`${o}${h}${t}`)})}}function O(i,e="",t="",o){return(n,r)=>{T(n,i).forEach(a=>{a.textContent=`${e}${r}${t}`})}}function X(i,e,t){return(o,n,r,s)=>{T(o,i).forEach(h=>{(t?t(n,h,r,s,o):!!n)?h.classList.add(e):h.classList.remove(e)})}}function ce(i,e="",t=""){return(o,n,r,s)=>{T(o,i).forEach(h=>{const F=`${e}${n}${t}`;h.classList.remove(`${e}${s}${t}`),h.classList.add(F)})}}var le=Object.defineProperty,de=Object.getOwnPropertyDescriptor,z=(i,e,t,o)=>{for(var n=o>1?void 0:o?de(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&le(e,t,n),n};let P=class extends d{constructor(){super(...arguments);p(this,"count",0)}onIncrement(){this.count++}onDecrement(){this.count--}onReset(){this.count=0}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .counter-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .count-display {
          font-size: 2rem;
          font-weight: bold;
          min-width: 80px;
          text-align: center;
          color: #3b82f6;
        }
        .buttons {
          display: flex;
          gap: 0.5rem;
        }
        button {
          cursor: pointer;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-increment {
          background: #22c55e;
          color: white;
        }
        .btn-increment:hover {
          background: #16a34a;
        }
        .btn-decrement {
          background: #ef4444;
          color: white;
        }
        .btn-decrement:hover {
          background: #dc2626;
        }
        .btn-reset {
          background: #e2e8f0;
          color: #1e293b;
        }
        .btn-reset:hover {
          background: #cbd5e1;
        }
      </style>
      <div class="counter-container">
        <div class="count-display">${this.count}</div>
        <div class="buttons">
          <button class="btn-decrement">−</button>
          <button class="btn-increment">+</button>
          <button class="btn-reset">Reset</button>
        </div>
      </div>
    `}};z([_([O(".count-display")]),m("count",!0),u({defaultValue:0})],P.prototype,"count",2);z([c(".btn-increment","click")],P.prototype,"onIncrement",1);z([c(".btn-decrement","click")],P.prototype,"onDecrement",1);z([c(".btn-reset","click")],P.prototype,"onReset",1);P=z([b("baz-counter")],P);var pe=Object.defineProperty,ue=Object.getOwnPropertyDescriptor,N=(i,e,t,o)=>{for(var n=o>1?void 0:o?ue(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&pe(e,t,n),n};let C=class extends d{constructor(){super(...arguments);p(this,"theme","light")}setLight(){this.theme="light"}setDark(){this.theme="dark"}setBlue(){this.theme="blue"}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .theme-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .theme-display {
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
          transition: all 0.3s;
        }
        .theme-display.theme-light {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }
        .theme-display.theme-dark {
          background: #1e293b;
          color: #f8fafc;
        }
        .theme-display.theme-blue {
          background: #3b82f6;
          color: white;
        }
        .buttons {
          display: flex;
          gap: 0.5rem;
        }
        button {
          cursor: pointer;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-light {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }
        .btn-dark {
          background: #1e293b;
          color: #f8fafc;
        }
        .btn-blue {
          background: #3b82f6;
          color: white;
        }
        button:hover {
          opacity: 0.8;
        }
      </style>
      <div class="theme-container">
        <div class="theme-display theme-${this.theme}">
          Current Theme: ${this.theme}
        </div>
        <div class="buttons">
          <button class="btn-light">Light</button>
          <button class="btn-dark">Dark</button>
          <button class="btn-blue">Blue</button>
        </div>
      </div>
    `}};N([re(),_([ce(".theme-display","theme-")]),m("theme",!0),u({defaultValue:"light"})],C.prototype,"theme",2);N([c(".btn-light","click")],C.prototype,"setLight",1);N([c(".btn-dark","click")],C.prototype,"setDark",1);N([c(".btn-blue","click")],C.prototype,"setBlue",1);C=N([b("baz-theme-switcher")],C);var fe=Object.defineProperty,he=Object.getOwnPropertyDescriptor,U=(i,e,t,o)=>{for(var n=o>1?void 0:o?he(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&fe(e,t,n),n};let W=class extends d{constructor(){super(...arguments);p(this,"text","Hello, World!")}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .binding-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
        }
        input {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #3b82f6;
        }
        .preview-box {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 1rem;
        }
        .text-preview {
          font-size: 1.25rem;
          color: #1e293b;
          word-break: break-word;
        }
        .char-count {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.5rem;
        }
      </style>
      <div class="binding-container">
        <div class="input-group">
          <label>Type something:</label>
          <input type="text" class="text-input" placeholder="Enter text..." />
        </div>
        <div class="preview-box">
          <div class="text-preview">${this.text}</div>
          <div class="char-count">Characters: ${this.text.length}</div>
        </div>
      </div>
    `}};U([_([ae(".text-input"),O(".text-preview"),O(".char-count","Characters: ")]),u({defaultValue:"Hello, World!"})],W.prototype,"text",2);W=U([b("baz-input-binding")],W);var be=Object.defineProperty,ge=Object.getOwnPropertyDescriptor,L=(i,e,t,o)=>{for(var n=o>1?void 0:o?ge(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&be(e,t,n),n};let A=class extends d{constructor(){super(...arguments);p(this,"value",0);p(this,"max",100)}onSliderChange(e,t,o,n){const r=n.target;this.value=parseInt(r.value,10)}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .progress-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .progress-bar {
          background: #e2e8f0;
          border-radius: 999px;
          height: 24px;
          overflow: hidden;
          position: relative;
        }
        .progress-fill {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .progress-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }
        .slider-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .progress-slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: #e2e8f0;
          border-radius: 4px;
          outline: none;
        }
        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .progress-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      </style>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${this.value}%" aria-valuenow="${this.value}" role="progressbar"></div>
          <span class="progress-text">${this.value}%</span>
        </div>
        <div class="slider-group">
          <input type="range" class="progress-slider" min="0" max="${this.max}" value="${this.value}" />
        </div>
      </div>
    `}};L([_([K(".progress-fill","width","%"),se(".progress-fill","aria-valuenow"),O(".progress-text","","%")]),m("value",!0),u({defaultValue:0})],A.prototype,"value",2);L([m("max",!0),u({defaultValue:100})],A.prototype,"max",2);L([c(".progress-slider","input")],A.prototype,"onSliderChange",1);A=L([b("baz-progress")],A);var me=Object.defineProperty,ve=Object.getOwnPropertyDescriptor,G=(i,e,t,o)=>{for(var n=o>1?void 0:o?ve(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&me(e,t,n),n};let H=class extends d{constructor(){super(...arguments);p(this,"isOpen",!1)}toggle(){this.isOpen=!this.isOpen}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .toggle-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f1f5f9;
          border-radius: 8px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }
        .toggle-header:hover {
          background: #e2e8f0;
        }
        .toggle-title {
          font-weight: 500;
          color: #1e293b;
        }
        .toggle-icon {
          font-size: 1.25rem;
          transition: transform 0.3s;
        }
        .toggle-icon.rotated {
          transform: rotate(180deg);
        }
        .panel {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
          background: #f8fafc;
          border-radius: 0 0 8px 8px;
        }
        .panel.panel-open {
          max-height: 200px;
          padding: 1rem;
        }
        .panel-content {
          color: #64748b;
          line-height: 1.6;
        }
        .status {
          margin-top: 1rem;
          padding: 0.5rem;
          background: #e0f2fe;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #0369a1;
        }
      </style>
      <div class="toggle-header">
        <span class="toggle-title">Click to toggle content</span>
        <span class="toggle-icon ${this.isOpen?"rotated":""}">▼</span>
      </div>
      <div class="panel ${this.isOpen?"panel-open":""}">
        <div class="panel-content">
          <p>
            This is the collapsible content! The panel uses <code>useToggleClass</code> 
            to add/remove the <code>panel-open</code> class based on the <code>isOpen</code> property.
          </p>
          <p>
            The <code>@FireRender()</code> decorator ensures the template is re-rendered 
            when the property changes.
          </p>
        </div>
      </div>
      <div class="status">
        Panel is currently: <strong>${this.isOpen?"Open":"Closed"}</strong>
      </div>
    `}};G([ie(),_([X(".panel","panel-open",i=>i===!0),X(".toggle-icon","rotated",i=>i===!0)]),u({defaultValue:!1})],H.prototype,"isOpen",2);G([c(".toggle-header","click")],H.prototype,"toggle",1);H=G([b("baz-toggle-panel")],H);var ye=Object.defineProperty,xe=Object.getOwnPropertyDescriptor,I=(i,e,t,o)=>{for(var n=o>1?void 0:o?xe(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&ye(e,t,n),n};let k=class extends d{constructor(){super(...arguments);p(this,"activeTab",0)}onTab1Click(){this.activeTab=0,this.updateTabs()}onTab2Click(){this.activeTab=1,this.updateTabs()}onTab3Click(){this.activeTab=2,this.updateTabs()}updateTabs(){var o,n;const e=(o=this.root)==null?void 0:o.querySelectorAll(".tab-btn"),t=(n=this.root)==null?void 0:n.querySelectorAll(".tab-content");e==null||e.forEach((r,s)=>{r.classList.toggle("active",s===this.activeTab)}),t==null||t.forEach((r,s)=>{r.classList.toggle("visible",s===this.activeTab)})}onRendered(){this.updateTabs()}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .tabs-container {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .tab-buttons {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .tab-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }
        .tab-btn:hover {
          color: #3b82f6;
          background: #eff6ff;
        }
        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: white;
        }
        .tab-content {
          display: none;
          padding: 20px;
        }
        .tab-content.visible {
          display: block;
        }
        .tab-content h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
        }
        .tab-content p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }
      </style>
      <div class="tabs-container">
        <div class="tab-buttons">
          <button class="tab-btn tab-btn-1 active">Overview</button>
          <button class="tab-btn tab-btn-2">Features</button>
          <button class="tab-btn tab-btn-3">Usage</button>
        </div>
        <div class="tab-content tab-content-1 visible">
          <h4>📖 Overview</h4>
          <p>Bazlama Web Component is a lightweight framework for building reusable web components with TypeScript decorators.</p>
        </div>
        <div class="tab-content tab-content-2">
          <h4>✨ Features</h4>
          <p>Property binding, attribute reflection, event actions, change hooks, and more. All with a simple decorator-based API.</p>
        </div>
        <div class="tab-content tab-content-3">
          <h4>🚀 Usage</h4>
          <p>Extend BazlamaWebComponent, add decorators to your properties, and implement getRenderTemplate() to define your component's HTML.</p>
        </div>
      </div>
    `}};I([m("active-tab",!0),u({defaultValue:0})],k.prototype,"activeTab",2);I([c(".tab-btn-1","click")],k.prototype,"onTab1Click",1);I([c(".tab-btn-2","click")],k.prototype,"onTab2Click",1);I([c(".tab-btn-3","click")],k.prototype,"onTab3Click",1);k=I([b("baz-tabs")],k);var we=Object.defineProperty,Pe=Object.getOwnPropertyDescriptor,E=(i,e,t,o)=>{for(var n=o>1?void 0:o?Pe(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&we(e,t,n),n};let w=class extends d{constructor(){super(...arguments);p(this,"items",[]);p(this,"nextId",0)}fireTodoAdded(e){this.dispatchEvent(new CustomEvent("todo-added",{detail:e,bubbles:!0,composed:!0}))}fireTodoRemoved(e){this.dispatchEvent(new CustomEvent("todo-removed",{detail:e,bubbles:!0,composed:!0}))}onAddClick(){var t;const e=(t=this.root)==null?void 0:t.querySelector(".todo-input");e&&e.value.trim()&&(this.addTodo(e.value.trim()),e.value="")}onInputKeypress(e,t,o,n){if(n.key==="Enter"){const s=t;s.value.trim()&&(this.addTodo(s.value.trim()),s.value="")}}onListClick(e,t,o,n){const r=n.target;if(r.classList.contains("delete-btn")){const s=parseInt(r.dataset.id||"0",10);this.removeTodo(s);return}if(r.classList.contains("todo-checkbox")){const s=parseInt(r.dataset.id||"0",10);this.toggleTodo(s)}}addTodo(e){const t={id:this.nextId++,text:e,completed:!1};this.items=[...this.items,t],this.fireTodoAdded({item:t}),this.updateList()}removeTodo(e){this.items=this.items.filter(t=>t.id!==e),this.fireTodoRemoved({id:e}),this.updateList()}toggleTodo(e){this.items=this.items.map(t=>t.id===e?{...t,completed:!t.completed}:t),this.updateList()}updateList(){var o,n;const e=(o=this.root)==null?void 0:o.querySelector(".todo-list"),t=(n=this.root)==null?void 0:n.querySelector(".todo-counter");if(e&&(this.items.length===0?e.innerHTML='<li class="empty-state">No todos yet. Add one above!</li>':e.innerHTML=this.items.map(r=>`
            <li class="todo-item ${r.completed?"completed":""}">
              <input 
                type="checkbox" 
                class="todo-checkbox" 
                data-id="${r.id}" 
                ${r.completed?"checked":""}
              />
              <span class="todo-text">${r.text}</span>
              <button class="delete-btn" data-id="${r.id}">×</button>
            </li>
          `).join("")),t){const r=this.items.filter(a=>!a.completed).length,s=this.items.length;t.textContent=`${r} of ${s} remaining`}}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .todo-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .todo-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          color: white;
        }
        .todo-header h3 {
          margin: 0 0 16px 0;
          font-size: 1.25rem;
        }
        .input-group {
          display: flex;
          gap: 8px;
        }
        .todo-input {
          flex: 1;
          padding: 10px 14px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }
        .add-btn {
          padding: 10px 20px;
          border: none;
          background: rgba(255,255,255,0.2);
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        .add-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .todo-list {
          list-style: none;
          margin: 0;
          padding: 0;
          max-height: 300px;
          overflow-y: auto;
        }
        .todo-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }
        .todo-item:hover {
          background: #f8fafc;
        }
        .todo-item.completed .todo-text {
          text-decoration: line-through;
          color: #94a3b8;
        }
        .todo-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .todo-text {
          flex: 1;
          color: #334155;
        }
        .delete-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .todo-item:hover .delete-btn {
          opacity: 1;
        }
        .delete-btn:hover {
          background: #fecaca;
        }
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #94a3b8;
          font-style: italic;
        }
        .todo-footer {
          padding: 12px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .todo-counter {
          color: #64748b;
          font-size: 13px;
        }
      </style>
      <div class="todo-container">
        <div class="todo-header">
          <h3>📝 Todo List</h3>
          <div class="input-group">
            <input type="text" class="todo-input" placeholder="What needs to be done?" />
            <button class="add-btn">Add</button>
          </div>
        </div>
        <ul class="todo-list">
          <li class="empty-state">No todos yet. Add one above!</li>
        </ul>
        <div class="todo-footer">
          <span class="todo-counter">0 of 0 remaining</span>
        </div>
      </div>
    `}};E([u({defaultValue:[]})],w.prototype,"items",2);E([u({defaultValue:0})],w.prototype,"nextId",2);E([c(".add-btn","click")],w.prototype,"onAddClick",1);E([c(".todo-input","keypress")],w.prototype,"onInputKeypress",1);E([c(".todo-list","click")],w.prototype,"onListClick",1);w=E([b("baz-todo")],w);var Ce=Object.defineProperty,ke=Object.getOwnPropertyDescriptor,y=(i,e,t,o)=>{for(var n=o>1?void 0:o?ke(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&Ce(e,t,n),n};let g=class extends d{constructor(){super(...arguments);p(this,"notifications",[]);p(this,"nextId",0);p(this,"duration",3e3)}fireNotificationShown(e){this.dispatchEvent(new CustomEvent("notification-shown",{detail:e,bubbles:!0,composed:!0}))}fireNotificationDismissed(e){this.dispatchEvent(new CustomEvent("notification-dismissed",{detail:e,bubbles:!0,composed:!0}))}onSuccessClick(){this.show("Operation completed successfully!","success")}onErrorClick(){this.show("Something went wrong. Please try again.","error")}onWarningClick(){this.show("Please review your input before continuing.","warning")}onInfoClick(){this.show("Here's some helpful information for you.","info")}onContainerClick(e,t,o,n){const r=n.target;if(r.classList.contains("dismiss-btn")){const s=parseInt(r.dataset.id||"0",10);this.dismiss(s)}}show(e,t="info"){const o={id:this.nextId++,message:e,type:t};this.notifications=[...this.notifications,o],this.fireNotificationShown({notification:o}),this.updateNotifications(),this.duration>0&&setTimeout(()=>{this.dismiss(o.id)},this.duration)}dismiss(e){var o;const t=(o=this.root)==null?void 0:o.querySelector(`[data-notification-id="${e}"]`);t&&(t.classList.add("dismissing"),setTimeout(()=>{this.notifications=this.notifications.filter(n=>n.id!==e),this.fireNotificationDismissed({id:e}),this.updateNotifications()},300))}updateNotifications(){var t;const e=(t=this.root)==null?void 0:t.querySelector(".notifications-container");e&&(e.innerHTML=this.notifications.map(o=>`
          <div class="notification notification-${o.type}" data-notification-id="${o.id}">
            <span class="notification-icon">${this.getIcon(o.type)}</span>
            <span class="notification-message">${o.message}</span>
            <button class="dismiss-btn" data-id="${o.id}">×</button>
          </div>
        `).join(""))}getIcon(e){return{success:"✓",error:"✕",warning:"⚠",info:"ℹ"}[e]}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .demo-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .trigger-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: transform 0.1s, box-shadow 0.2s;
        }
        .trigger-btn:active {
          transform: scale(0.98);
        }
        .btn-success {
          background: #10b981;
          color: white;
        }
        .btn-success:hover {
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .btn-error {
          background: #ef4444;
          color: white;
        }
        .btn-error:hover {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        .btn-warning {
          background: #f59e0b;
          color: white;
        }
        .btn-warning:hover {
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }
        .btn-info {
          background: #3b82f6;
          color: white;
        }
        .btn-info:hover {
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .notifications-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 60px;
        }
        .notification {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          animation: slideIn 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .notification.dismissing {
          animation: slideOut 0.3s ease forwards;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(20px);
          }
        }
        .notification-success {
          background: #ecfdf5;
          border-left: 4px solid #10b981;
        }
        .notification-error {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
        }
        .notification-warning {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
        }
        .notification-info {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
        }
        .notification-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
        }
        .notification-success .notification-icon {
          background: #10b981;
          color: white;
        }
        .notification-error .notification-icon {
          background: #ef4444;
          color: white;
        }
        .notification-warning .notification-icon {
          background: #f59e0b;
          color: white;
        }
        .notification-info .notification-icon {
          background: #3b82f6;
          color: white;
        }
        .notification-message {
          flex: 1;
          color: #334155;
          font-size: 14px;
        }
        .dismiss-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .dismiss-btn:hover {
          background: rgba(0,0,0,0.1);
          color: #64748b;
        }
      </style>
      <div class="demo-container">
        <div class="button-group">
          <button class="trigger-btn btn-success">✓ Success</button>
          <button class="trigger-btn btn-error">✕ Error</button>
          <button class="trigger-btn btn-warning">⚠ Warning</button>
          <button class="trigger-btn btn-info">ℹ Info</button>
        </div>
        <div class="notifications-container"></div>
      </div>
    `}};y([u({defaultValue:[]})],g.prototype,"notifications",2);y([u({defaultValue:0})],g.prototype,"nextId",2);y([m("duration",!0),u({defaultValue:3e3})],g.prototype,"duration",2);y([c(".btn-success","click")],g.prototype,"onSuccessClick",1);y([c(".btn-error","click")],g.prototype,"onErrorClick",1);y([c(".btn-warning","click")],g.prototype,"onWarningClick",1);y([c(".btn-info","click")],g.prototype,"onInfoClick",1);y([c(".notifications-container","click")],g.prototype,"onContainerClick",1);g=y([b("baz-notification")],g);var De=Object.defineProperty,Te=Object.getOwnPropertyDescriptor,Q=(i,e,t,o)=>{for(var n=o>1?void 0:o?Te(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&De(e,t,n),n};let B=class extends d{constructor(){super(...arguments);p(this,"activePanel",-1)}onHeaderClick(e,t,o,n){const r=parseInt(t.dataset.index||"-1",10);this.activePanel=this.activePanel===r?-1:r,this.updatePanels()}updatePanels(){var o,n;const e=(o=this.root)==null?void 0:o.querySelectorAll(".accordion-header"),t=(n=this.root)==null?void 0:n.querySelectorAll(".accordion-content");e==null||e.forEach((r,s)=>{s===this.activePanel?r.classList.add("active"):r.classList.remove("active")}),t==null||t.forEach((r,s)=>{const a=r;s===this.activePanel?(a.style.maxHeight=a.scrollHeight+"px",a.classList.add("open")):(a.style.maxHeight="0",a.classList.remove("open"))})}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .accordion {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .accordion-item {
          border-bottom: 1px solid #e2e8f0;
        }
        .accordion-item:last-child {
          border-bottom: none;
        }
        .accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px 20px;
          border: none;
          background: #f8fafc;
          cursor: pointer;
          text-align: left;
          font-size: 15px;
          font-weight: 500;
          color: #334155;
          transition: background 0.2s;
        }
        .accordion-header:hover {
          background: #f1f5f9;
        }
        .accordion-header.active {
          background: #eff6ff;
          color: #3b82f6;
        }
        .accordion-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        .accordion-header.active .accordion-icon {
          transform: rotate(180deg);
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          background: white;
        }
        .accordion-content.open {
          border-top: 1px solid #e2e8f0;
        }
        .accordion-body {
          padding: 16px 20px;
          color: #64748b;
          line-height: 1.6;
        }
        .accordion-body h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 14px;
        }
        .accordion-body p {
          margin: 0;
        }
        .accordion-body ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }
        .accordion-body li {
          margin: 4px 0;
        }
      </style>
      <div class="accordion">
        <div class="accordion-item">
          <button class="accordion-header" data-index="0">
            <span>🎯 What is Bazlama Web Component?</span>
            <span class="accordion-icon">▼</span>
          </button>
          <div class="accordion-content">
            <div class="accordion-body">
              <h4>A Modern Web Component Framework</h4>
              <p>Bazlama Web Component is a lightweight TypeScript framework that makes building custom elements simple and intuitive using decorators.</p>
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <button class="accordion-header" data-index="1">
            <span>⚡ Key Features</span>
            <span class="accordion-icon">▼</span>
          </button>
          <div class="accordion-content">
            <div class="accordion-body">
              <h4>What's Included</h4>
              <ul>
                <li><strong>@Property</strong> - Reactive property binding</li>
                <li><strong>@Attribute</strong> - Attribute reflection</li>
                <li><strong>@ChangeHooks</strong> - DOM update hooks</li>
                <li><strong>@EventAction</strong> - Declarative event handling</li>
                <li><strong>@FireEvent</strong> - Custom event dispatching</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <button class="accordion-header" data-index="2">
            <span>🚀 Getting Started</span>
            <span class="accordion-icon">▼</span>
          </button>
          <div class="accordion-content">
            <div class="accordion-body">
              <h4>Quick Start Guide</h4>
              <p>Install the package, extend BazlamaWebComponent, add your decorators, and implement getRenderTemplate(). That's all you need to create powerful custom elements!</p>
            </div>
          </div>
        </div>
      </div>
    `}};Q([u({defaultValue:-1})],B.prototype,"activePanel",2);Q([c(".accordion-header","click")],B.prototype,"onHeaderClick",1);B=Q([b("baz-accordion")],B);var _e=Object.defineProperty,Ee=Object.getOwnPropertyDescriptor,j=(i,e,t,o)=>{for(var n=o>1?void 0:o?Ee(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&_e(e,t,n),n};let $=class extends d{constructor(){super(...arguments);p(this,"color","#3b82f6")}fireColorChange(e){this.dispatchEvent(new CustomEvent("color-change",{detail:e,bubbles:!0,composed:!0}))}onColorInput(e,t,o,n){const r=n.target;this.color=r.value,this.fireColorChange({color:this.color,rgb:this.hexToRgb(this.color)}),this.updateRgbDisplay()}onPresetClick(e,t,o,n){var s;const r=t.dataset.color;if(r){this.color=r;const a=(s=this.root)==null?void 0:s.querySelector(".color-input");a&&(a.value=r),this.fireColorChange({color:this.color,rgb:this.hexToRgb(this.color)}),this.updateRgbDisplay()}}hexToRgb(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?`rgb(${parseInt(t[1],16)}, ${parseInt(t[2],16)}, ${parseInt(t[3],16)})`:"rgb(0, 0, 0)"}updateRgbDisplay(){var t;const e=(t=this.root)==null?void 0:t.querySelector(".rgb-value");e&&(e.textContent=this.hexToRgb(this.color))}onConnected(){super.onConnected(),setTimeout(()=>this.updateRgbDisplay(),0)}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .picker-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .preview-section {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .color-preview {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          background-color: #3b82f6;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .color-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }
        .color-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .color-label {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
          width: 40px;
        }
        .hex-value, .rgb-value {
          font-family: monospace;
          font-size: 14px;
          color: #334155;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .input-section {
          margin-bottom: 20px;
        }
        .color-input {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          padding: 4px;
        }
        .color-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-input::-webkit-color-swatch {
          border: none;
          border-radius: 6px;
        }
        .presets-section h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .preset-colors {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .preset-color {
          width: 36px;
          height: 36px;
          border: 2px solid white;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .preset-color:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
      </style>
      <div class="picker-container">
        <div class="preview-section">
          <div class="color-preview"></div>
          <div class="color-info">
            <div class="color-value">
              <span class="color-label">HEX</span>
              <span class="hex-value">#3b82f6</span>
            </div>
            <div class="color-value">
              <span class="color-label">RGB</span>
              <span class="rgb-value">rgb(59, 130, 246)</span>
            </div>
          </div>
        </div>
        <div class="input-section">
          <input type="color" class="color-input" value="#3b82f6" />
        </div>
        <div class="presets-section">
          <h4>Preset Colors</h4>
          <div class="preset-colors">
            <button class="preset-color" data-color="#ef4444" style="background: #ef4444"></button>
            <button class="preset-color" data-color="#f97316" style="background: #f97316"></button>
            <button class="preset-color" data-color="#eab308" style="background: #eab308"></button>
            <button class="preset-color" data-color="#22c55e" style="background: #22c55e"></button>
            <button class="preset-color" data-color="#14b8a6" style="background: #14b8a6"></button>
            <button class="preset-color" data-color="#3b82f6" style="background: #3b82f6"></button>
            <button class="preset-color" data-color="#8b5cf6" style="background: #8b5cf6"></button>
            <button class="preset-color" data-color="#ec4899" style="background: #ec4899"></button>
          </div>
        </div>
      </div>
    `}};j([_([K(".color-preview","background-color"),O(".hex-value")]),m("color",!0),u({defaultValue:"#3b82f6"})],$.prototype,"color",2);j([c(".color-input","input")],$.prototype,"onColorInput",1);j([c(".preset-color","click")],$.prototype,"onPresetClick",1);$=j([b("baz-color-picker")],$);var Oe=Object.defineProperty,Ae=Object.getOwnPropertyDescriptor,x=(i,e,t,o)=>{for(var n=o>1?void 0:o?Ae(e,t):e,r=i.length-1,s;r>=0;r--)(s=i[r])&&(n=(o?s(e,t,n):s(n))||n);return o&&n&&Oe(e,t,n),n};let v=class extends d{constructor(){super(...arguments);p(this,"value",0);p(this,"hoverValue",0);p(this,"max",5);p(this,"readonly",!1)}fireRatingChange(e){this.dispatchEvent(new CustomEvent("rating-change",{detail:e,bubbles:!0,composed:!0}))}onStarClick(e,t,o,n){if(this.readonly)return;const s=n.target.closest(".star");s&&s.dataset.value&&(this.value=parseInt(s.dataset.value,10),this.fireRatingChange({value:this.value,max:this.max}))}onStarHover(e,t,o,n){if(this.readonly)return;const s=n.target.closest(".star");s&&s.dataset.value&&(this.hoverValue=parseInt(s.dataset.value,10),this.updateStars())}onStarLeave(){this.readonly||(this.hoverValue=0,this.updateStars())}updateStars(){var n,r;const e=(n=this.root)==null?void 0:n.querySelectorAll(".star"),t=this.hoverValue||this.value;e==null||e.forEach((s,a)=>{const h=s;a<t?(h.classList.add("active"),h.classList.toggle("hover",this.hoverValue>0)):h.classList.remove("active","hover")});const o=(r=this.root)==null?void 0:r.querySelector(".rating-text");o&&(o.textContent=`${this.value} / ${this.max}`)}onRendered(){this.updateStars()}getRenderTemplate(){return`
      <style>
        :host {
          display: block;
        }
        .rating-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .stars-container {
          display: flex;
          gap: 4px;
        }
        .star {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.2s;
          color: #e2e8f0;
          -webkit-user-select: none;
          user-select: none;
        }
        :host([readonly]) .star {
          cursor: default;
        }
        .star:hover:not(:host([readonly]) .star) {
          transform: scale(1.2);
        }
        .star.active {
          color: #fbbf24;
        }
        .star.hover {
          color: #fcd34d;
        }
        .rating-text {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        .rating-label {
          font-size: 13px;
          color: #94a3b8;
        }
      </style>
      <div class="rating-container">
        <div class="rating-label">Rate your experience</div>
        <div class="stars-container">
          ${Array.from({length:this.max},(t,o)=>o+1).map(t=>`<span class="star" data-value="${t}">★</span>`).join("")}
        </div>
        <div class="rating-text">0 / ${this.max}</div>
      </div>
    `}};x([m("value",!0),u({defaultValue:0})],v.prototype,"value",2);x([u({defaultValue:0})],v.prototype,"hoverValue",2);x([m("max",!0),u({defaultValue:5})],v.prototype,"max",2);x([m("readonly",!0),u({defaultValue:!1})],v.prototype,"readonly",2);x([c(".stars-container","click")],v.prototype,"onStarClick",1);x([c(".stars-container","mouseover")],v.prototype,"onStarHover",1);x([c(".stars-container","mouseout")],v.prototype,"onStarLeave",1);v=x([b("baz-rating")],v);console.log("🍞 Bazlama Web Component - Core Sample loaded!");
