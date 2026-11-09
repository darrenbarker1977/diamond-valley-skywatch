import unittest,importlib.util,pathlib,datetime,copy
spec=importlib.util.spec_from_file_location('weather_cache',pathlib.Path(__file__).resolve().parents[1]/'scripts/update-weather.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Cache(unittest.TestCase):
 def setUp(self):
  self.now=datetime.datetime(2026,11,9,16,tzinfo=datetime.timezone.utc);stamp=int(self.now.timestamp())
  self.raw=[{'displayName':'Diamond Valley','lat':50.679862,'lon':-114.253577,'mtimes':{'HOURLY_FORECAST':stamp},'hourlyFcst':{'hourly':[{'epochTime':stamp+i*3600,'condition':'Clear','temperature':{'metric':'10'},'windSpeed':{'metric':'5'},'windGust':{'metric':''},'precip':'0'} for i in range(6)]},'dailyFcst':{'dailyIssuedTimeEpoch':str(stamp),'daily':[{'date':d+', 9 Nov','periodLabel':'Night','summary':'Clear','text':'Clear. Low plus 1.','temperature':{'metric':'1','periodLow':1}} for d in ['Mon','Tue','Wed','Thu','Fri']]}}]
 def test_valid_coordinate_product_preserves_values_and_absent_gust(self):
  result=module.convert(self.raw,self.now);h=result['feature']['properties']['hourlyForecastGroup']['hourlyForecasts'][0];self.assertEqual(result['requested']['latitude'],50.68);self.assertEqual(h['temperature']['value']['en'],10);self.assertIsNone(h['wind']['gust']['value']['en']);self.assertEqual(h['lop']['value']['en'],0)
 def test_wrong_place_stale_issues_and_incomplete_products_are_rejected(self):
  for key,value in [('lat',51.05),('mtimes',{'HOURLY_FORECAST':self.now.timestamp()-40*3600}),('hourlyFcst',{'hourly':[]}),('dailyFcst',{'dailyIssuedTimeEpoch':self.now.timestamp(),'daily':[]})]:
   bad=copy.deepcopy(self.raw);bad[0][key]=value
   with self.assertRaises((ValueError,TypeError)):module.convert(bad,self.now)
if __name__=='__main__':unittest.main()
