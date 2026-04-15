import urllib.request
import json

BASE_URL = 'http://localhost:5001/api'

def request(url):
    try:
        response = urllib.request.urlopen(f"{BASE_URL}{url}")
        return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    categories = request('/public/categories')
    if not categories:
        return
        
    print("Category Counts:")
    for cat in categories:
        print(f"- {cat['category_name']} (ID: {cat['category_id']}): {cat.get('product_count', 0) or cat.get('total_product_count', 0)} products")

if __name__ == '__main__':
    main()
