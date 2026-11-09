#!/usr/bin/env python3
"""Publish the official default-site point forecast; never fetch personal locations."""
import json,datetime,urllib.request,pathlib,math
URL='https://weather.gc.ca/api/app/v3/en/Location/50.68,-114.25?type=city'
def convert(raw,now):
 if not isinstance(raw,list) or len(raw)!=1:raise ValueError('No single official point forecast')
 p=raw[0]
 if not isinstance(p.get('displayName'),str) or not all(isinstance(p.get(k),(float,int)) and math.isfinite(p[k]) for k in ['lat','lon']):raise ValueError('Missing forecast point')
 if abs(p['lat']-50.68)>.02 or abs(p['lon']+114.25)>.03:raise ValueError('Wrong forecast point')
 def iso(v):return datetime.datetime.fromtimestamp(float(v),datetime.timezone.utc).isoformat().replace('+00:00','Z')
 def en(v):return {'en':v}
 def number(v):
  try:
   if v is None or str(v).strip()=='':return None
   n=float(v);return n if math.isfinite(n) else None
  except (TypeError,ValueError):return None
 def measure(v,u):return {'units':en(u),'value':en(number(v))}
 hi=p.get('mtimes',{}).get('HOURLY_FORECAST');di=p.get('dailyFcst',{}).get('dailyIssuedTimeEpoch')
 for stamp in [hi,di]:
  age=now.timestamp()-float(stamp)
  if not -300<=age<=36*3600:raise ValueError('Official issue is stale or future dated')
 hours=[]
 for h in p.get('hourlyFcst',{}).get('hourly',[]):
  hours.append({'timestamp':iso(h['epochTime']),'condition':en(h.get('condition','')),'temperature':measure(h.get('temperature',{}).get('metric'),'C'),'wind':{'speed':measure(h.get('windSpeed',{}).get('metric'),'km/h'),'gust':measure(h.get('windGust',{}).get('metric'),'km/h')},'lop':measure(h.get('precip'),'%')})
 weekdays={'Mon':'Monday','Tue':'Tuesday','Wed':'Wednesday','Thu':'Thursday','Fri':'Friday','Sat':'Saturday','Sun':'Sunday'};daily=[]
 for d in p.get('dailyFcst',{}).get('daily',[]):
  day=weekdays.get(str(d.get('date',''))[:3]);night='night' in str(d.get('periodLabel','')).lower() or 'periodLow' in d.get('temperature',{})
  if not day:continue
  daily.append({'period':{'value':en(day+(' night' if night else ''))},'abbreviatedForecast':{'textSummary':en(d.get('summary',''))},'textSummary':en(d.get('text','')),'cloudPrecip':en(d.get('text') or d.get('summary','')),'temperatures':{'temperature':[{'class':en('low' if night else 'high'),**measure(d.get('temperature',{}).get('metric'),'C')}]}})
 if len(hours)<6 or sum('night' in d['period']['value']['en'] for d in daily)<5:raise ValueError('Incomplete point forecast')
 return {'version':1,'fetchedAt':now.isoformat().replace('+00:00','Z'),'requested':{'latitude':50.68,'longitude':-114.25},'source':URL,'feature':{'type':'Feature','geometry':{'type':'Point','coordinates':[p['lon'],p['lat']]},'properties':{'name':en(p['displayName']),'coordinateForecast':True,'hourlyForecastGroup':{'timestamp':en(iso(hi)),'hourlyForecasts':hours},'forecastGroup':{'timestamp':en(iso(di)),'forecasts':daily}}}}
def main():
 now=datetime.datetime.now(datetime.timezone.utc)
 with urllib.request.urlopen(URL,timeout=25) as r:raw=json.load(r)
 value=convert(raw,now);target=pathlib.Path(__file__).resolve().parents[1]/'data/weather-diamond-valley.json';target.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n');print('Official Diamond Valley coordinate forecast validated and saved')
if __name__=='__main__':main()
