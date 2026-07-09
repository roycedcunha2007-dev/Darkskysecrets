import cv2
import numpy as np

img1 = cv2.imread('public/light pollution 1.jpeg') # 1024x1536
img8 = cv2.imread('public/light pollution 8.jpeg') # 1024x1024

# Let's crop the bottom 400 pixels of img8 (1024x400)
# and try to find where it matches in img1.
skyline8 = img8[-400:, :]
gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
gray_skyline8 = cv2.cvtColor(skyline8, cv2.COLOR_BGR2GRAY)

# Let's search for matches using different scales of skyline8.
# Since the camera position might be slightly different or lens zoom is different,
# let's try different scaling factors for skyline8.
best_scale = 1.0
best_val = -1
best_loc = (0, 0)

for scale in np.linspace(0.8, 1.2, 41):
    w = int(1024 * scale)
    h = int(400 * scale)
    if w > 1024:
        # crop scaled image
        scaled = cv2.resize(gray_skyline8, (w, h))
        # center crop to 1024 width
        start_x = (w - 1024) // 2
        scaled_crop = scaled[:, start_x:start_x+1024]
    else:
        # pad scaled image
        scaled = cv2.resize(gray_skyline8, (w, h))
        pad_l = (1024 - w) // 2
        pad_r = 1024 - w - pad_l
        scaled_crop = cv2.copyMakeBorder(scaled, 0, 0, pad_l, pad_r, cv2.BORDER_CONSTANT, value=0)
    
    # search in gray1
    result = cv2.matchTemplate(gray1, scaled_crop, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(result)
    
    print(f"Scale: {scale:.2f}, Max correlation: {max_val:.4f} at {max_loc}")
    if max_val > best_val:
        best_val = max_val
        best_scale = scale
        best_loc = max_loc

print(f"Best scale: {best_scale} with correlation {best_val} at {best_loc}")
