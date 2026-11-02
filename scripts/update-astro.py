"""Fetch a public 7Timer ASTRO forecast for the website's public DV model point."""
import datetime as dt
import json
from pathlib import Path
import urllib.request

URL = 'https://www.7timer.info/bin/api.pl?lon=-114.25&lat=50.68&product=astro&output=json&points=80'
DEST = Path(__file__).resolve().parents[1] / 'data/astro-diamond-valley.json'

def validate(data, now):
    if data.get('product') != 'astro' or not isinstance(data.get('init'), str):
        raise ValueError('Invalid ASTRO product')
    init = dt.datetime.strptime(data['init'], '%Y%m%d%H').replace(tzinfo=dt.timezone.utc)
    if not -1800 <= (now - init).total_seconds() <= 86400:
        raise ValueError('Model issue time is future or more than 24 hours old')
    rows = data.get('dataseries')
    if not isinstance(rows, list) or not 1 <= len(rows) <= 80:
        raise ValueError('Invalid forecast series')
    previous, valid = 0, 0
    for row in rows:
        point = row.get('timepoint')
        if type(point) is not int or not previous < point <= 240 or point % 3:
            raise ValueError('Invalid forecast time step')
        previous = point
        for key in ['seeing', 'transparency']:
            value = row.get(key)
            if type(value) is not int or value not in [1, 2, 3, 4, 5, 6, 7, 8, -9999]:
                raise ValueError('Invalid astronomy category')
            valid += value != -9999
    if not valid:
        raise ValueError('No astronomy values supplied')

def main():
    request = urllib.request.Request(URL, headers={'User-Agent': 'BarkerAfterDark/1.0 astronomy forecast cache'})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read(512000))
    now = dt.datetime.now(dt.timezone.utc)
    validate(data, now)
    envelope = {'schema': 1, 'source': '7timer-astro', 'site': {'latitude': 50.68, 'longitude': -114.25, 'label': 'Diamond Valley'}, 'fetchedAt': now.isoformat(), 'sourceURL': URL, 'forecast': data}
    if DEST.exists():
        prior = json.loads(DEST.read_text())
        if prior.get('forecast') == data and prior.get('site') == envelope['site']:
            print('Published model unchanged; kept existing cache')
            return
    DEST.parent.mkdir(parents=True, exist_ok=True)
    temporary = DEST.with_suffix('.tmp')
    temporary.write_text(json.dumps(envelope, indent=2) + '\n')
    temporary.replace(DEST)
    print(f"Updated {DEST.name}: model {data['init']}, {len(data['dataseries'])} points")

if __name__ == '__main__':
    main()
