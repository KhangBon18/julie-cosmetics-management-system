#!/bin/bash
# Get JWT token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get token"
  exit 1
fi

# We know we have products 1 to 14
for i in {1..14}; do
  echo "Fetching product $i..."
  PRODUCT_JSON=$(curl -s http://localhost:5001/api/public/products/$i)
  
  if [ -z "$PRODUCT_JSON" ] || [ "$(echo "$PRODUCT_JSON" | jq -r '.message')" != "null" ]; then
    echo "Product $i not found or error, skipping"
    continue
  fi
  
  IMAGE_URL="/uploads/product_images/product_${i}.png"
  
  # Update JSON with new image_url
  UPDATED_JSON=$(echo "$PRODUCT_JSON" | jq --arg img "$IMAGE_URL" '.image_url = $img')
  
  # PUT the updated JSON
  echo "Updating product $i..."
  RESPONSE=$(curl -s -X PUT http://localhost:5001/api/products/$i \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$UPDATED_JSON")
  
  echo "Response for $i: $(echo "$RESPONSE" | jq -r '.message')"
done

echo "Done"
