import urllib.request
try:
    resp = urllib.request.urlopen("http://localhost:5001/api/public/categories/tree")
    print("API is accessible")
except Exception as e:
    print(e)
