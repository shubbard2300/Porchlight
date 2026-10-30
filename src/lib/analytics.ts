/** Google Analytics 4 for porchlightcontest.com. Set GA_MEASUREMENT_ID to override, or to "off" to turn it off. */
const GA_DEFAULT_ID = 'G-K2GRKN33FE';

/**
 * The GA4 measurement ID when analytics should run, else null. Only the live site reports, so preview
 * deploys and local testing don't mix test sign-ups into the real numbers. GA_DEBUG=1 turns it on anywhere.
 */
export function gaMeasurementId(): string | null {
  const id = process.env.GA_MEASUREMENT_ID ?? GA_DEFAULT_ID;
  if (!id || id === 'off') return null;
  return process.env.VERCEL_ENV === 'production' || process.env.GA_DEBUG === '1' ? id : null;
}

/** The query parameter that tells the landing page a sign-up was just confirmed, so it can report the conversion once. */
export const SIGNUP_PARAM = 'signup';

/** Adds ?signup=viewer|host to a path (keeping any #hash at the end), marking a freshly confirmed account. */
export function withSignupMark(path: string, accountType: 'VIEWER' | 'HOST'): string {
  const [base, hash] = path.split('#', 2);
  const mark = `${SIGNUP_PARAM}=${accountType === 'HOST' ? 'host' : 'viewer'}`;
  return `${base}${base.includes('?') ? '&' : '?'}${mark}${hash !== undefined ? `#${hash}` : ''}`;
}

/** Remembers in this browser that the visitor turned analytics off on the Cookie Policy page. */
export const ANALYTICS_OPT_OUT_KEY = 'pl-no-analytics';

/**
 * The inline script that starts GA. It stays off when the browser sends Global Privacy Control or the
 * visitor opted out. A ?signup=viewer|host mark is reported as sign_up plus a role event (viewer_signup or
 * host_signup, the two conversions), then removed from the address bar so a reload doesn't count it twice.
 */
export function gaInitScript(id: string): string {
  return `(function(){
var id=${JSON.stringify(id)};
var off=false;try{off=navigator.globalPrivacyControl===true||localStorage.getItem(${JSON.stringify(ANALYTICS_OPT_OUT_KEY)})==='1';}catch(e){}
if(off){window['ga-disable-'+id]=true;}
window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};
var u=new URL(location.href);var role=u.searchParams.get(${JSON.stringify(SIGNUP_PARAM)});
if(role){u.searchParams.delete(${JSON.stringify(SIGNUP_PARAM)});try{history.replaceState(history.state,'',u.pathname+u.search+u.hash);}catch(e){}}
if(off)return;
gtag('js',new Date());
gtag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false});
if(role==='viewer'||role==='host'){gtag('event','sign_up',{method:'email',account_type:role});gtag('event',role+'_signup',{method:'email'});}
})();`;
}
