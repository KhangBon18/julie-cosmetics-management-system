import requests
from bs4 import BeautifulSoup
import json

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10._15_7)'}

try:
    print("Testing Hasaki...")
    url = "https://hasaki.vn/danh-muc/nuoc-hoa-C31.html"
    res = requests.get(url, headers=headers, timeout=5)
    soup = BeautifulSoup(res.text, 'html.parser')
    items = soup.select('.ProductGridItem__itemOuter')
    print(f"Hasaki products found: {len(items)}")
except Exception as e:
    print(e)
