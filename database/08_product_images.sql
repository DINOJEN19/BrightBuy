-- Persistent product galleries. Soft deletion prevents removed seed pictures returning on upgrade.
USE brightbuy;
CREATE TABLE IF NOT EXISTS PRODUCT_IMAGE (
 image_id INT AUTO_INCREMENT PRIMARY KEY,
 product_id INT NOT NULL,
 file_path VARCHAR(255) NULL,
 mime_type VARCHAR(40) NULL,
 image_data MEDIUMBLOB NULL,
 sort_order INT NOT NULL DEFAULT 0,
 deleted_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_product_image_path(product_id,file_path),
 CONSTRAINT fk_product_image_product FOREIGN KEY(product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/technova-pulse-12.webp',1 FROM PRODUCT WHERE product_name='TechNova Pulse 12';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/technova-pulse-12-view-2.webp',2 FROM PRODUCT WHERE product_name='TechNova Pulse 12';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/technova-pulse-12-mini.webp',1 FROM PRODUCT WHERE product_name='TechNova Pulse 12 Mini';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/technova-pulse-12-mini-view-2.webp',2 FROM PRODUCT WHERE product_name='TechNova Pulse 12 Mini';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/solaris-orbit-s5.webp',1 FROM PRODUCT WHERE product_name='Solaris Orbit S5';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/solaris-orbit-s5-view-2.webp',2 FROM PRODUCT WHERE product_name='Solaris Orbit S5';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/solaris-orbit-s5-lite.webp',1 FROM PRODUCT WHERE product_name='Solaris Orbit S5 Lite';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/solaris-orbit-s5-lite-view-2.webp',2 FROM PRODUCT WHERE product_name='Solaris Orbit S5 Lite';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/vertex-book-air-14.webp',1 FROM PRODUCT WHERE product_name='Vertex Book Air 14';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/vertex-book-air-14-view-2.webp',2 FROM PRODUCT WHERE product_name='Vertex Book Air 14';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/vertex-book-pro-16.webp',1 FROM PRODUCT WHERE product_name='Vertex Book Pro 16';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/vertex-book-pro-16-view-2.webp',2 FROM PRODUCT WHERE product_name='Vertex Book Pro 16';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/nimbus-slate-13.webp',1 FROM PRODUCT WHERE product_name='Nimbus Slate 13';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/nimbus-slate-13-view-2.webp',2 FROM PRODUCT WHERE product_name='Nimbus Slate 13';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/nimbus-slate-13-ultra.webp',1 FROM PRODUCT WHERE product_name='Nimbus Slate 13 Ultra';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/nimbus-slate-13-ultra-view-2.webp',2 FROM PRODUCT WHERE product_name='Nimbus Slate 13 Ultra';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/echowave-buds-pro.webp',1 FROM PRODUCT WHERE product_name='EchoWave Buds Pro';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/echowave-buds-pro-view-2.webp',2 FROM PRODUCT WHERE product_name='EchoWave Buds Pro';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/echowave-buds-lite.webp',1 FROM PRODUCT WHERE product_name='EchoWave Buds Lite';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/echowave-buds-lite-view-2.webp',2 FROM PRODUCT WHERE product_name='EchoWave Buds Lite';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/pulseaudio-over-ear-x1.webp',1 FROM PRODUCT WHERE product_name='PulseAudio Over-Ear X1';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/pulseaudio-over-ear-x1-view-2.webp',2 FROM PRODUCT WHERE product_name='PulseAudio Over-Ear X1';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/pulseaudio-speaker-mini.webp',1 FROM PRODUCT WHERE product_name='PulseAudio Speaker Mini';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/pulseaudio-speaker-mini-view-2.webp',2 FROM PRODUCT WHERE product_name='PulseAudio Speaker Mini';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/orbit-watch-s2.webp',1 FROM PRODUCT WHERE product_name='Orbit Watch S2';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/orbit-watch-s2-view-2.webp',2 FROM PRODUCT WHERE product_name='Orbit Watch S2';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/orbit-watch-s2-sport.webp',1 FROM PRODUCT WHERE product_name='Orbit Watch S2 Sport';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/orbit-watch-s2-sport-view-2.webp',2 FROM PRODUCT WHERE product_name='Orbit Watch S2 Sport';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zenith-fit-band-3.webp',1 FROM PRODUCT WHERE product_name='Zenith Fit Band 3';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zenith-fit-band-3-view-2.webp',2 FROM PRODUCT WHERE product_name='Zenith Fit Band 3';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zenith-fit-band-3-kids.webp',1 FROM PRODUCT WHERE product_name='Zenith Fit Band 3 Kids';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zenith-fit-band-3-kids-view-2.webp',2 FROM PRODUCT WHERE product_name='Zenith Fit Band 3 Kids';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-hub-mini.webp',1 FROM PRODUCT WHERE product_name='HomeSense Hub Mini';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-hub-mini-view-2.webp',2 FROM PRODUCT WHERE product_name='HomeSense Hub Mini';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-smart-plug.webp',1 FROM PRODUCT WHERE product_name='HomeSense Smart Plug';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-smart-plug-view-2.webp',2 FROM PRODUCT WHERE product_name='HomeSense Smart Plug';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-security-cam.webp',1 FROM PRODUCT WHERE product_name='HomeSense Security Cam';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-security-cam-view-2.webp',2 FROM PRODUCT WHERE product_name='HomeSense Security Cam';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-smart-bulb-pack.webp',1 FROM PRODUCT WHERE product_name='HomeSense Smart Bulb Pack';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/homesense-smart-bulb-pack-view-2.webp',2 FROM PRODUCT WHERE product_name='HomeSense Smart Bulb Pack';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/playforge-controller-x.webp',1 FROM PRODUCT WHERE product_name='PlayForge Controller X';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/playforge-controller-x-view-2.webp',2 FROM PRODUCT WHERE product_name='PlayForge Controller X';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/playforge-headset-elite.webp',1 FROM PRODUCT WHERE product_name='PlayForge Headset Elite';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/playforge-headset-elite-view-2.webp',2 FROM PRODUCT WHERE product_name='PlayForge Headset Elite';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/gearup-gaming-mouse.webp',1 FROM PRODUCT WHERE product_name='GearUp Gaming Mouse';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/gearup-gaming-mouse-view-2.webp',2 FROM PRODUCT WHERE product_name='GearUp Gaming Mouse';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/gearup-mechanical-keyboard.webp',1 FROM PRODUCT WHERE product_name='GearUp Mechanical Keyboard';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/gearup-mechanical-keyboard-view-2.webp',2 FROM PRODUCT WHERE product_name='GearUp Mechanical Keyboard';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/lenscraft-actioncam-4k.webp',1 FROM PRODUCT WHERE product_name='LensCraft ActionCam 4K';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/lenscraft-actioncam-4k-view-2.webp',2 FROM PRODUCT WHERE product_name='LensCraft ActionCam 4K';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/lenscraft-mirrorless-m100.webp',1 FROM PRODUCT WHERE product_name='LensCraft Mirrorless M100';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/lenscraft-mirrorless-m100-view-2.webp',2 FROM PRODUCT WHERE product_name='LensCraft Mirrorless M100';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/clearview-webcam-hd.webp',1 FROM PRODUCT WHERE product_name='ClearView Webcam HD';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/clearview-webcam-hd-view-2.webp',2 FROM PRODUCT WHERE product_name='ClearView Webcam HD';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/clearview-instant-print-cam.webp',1 FROM PRODUCT WHERE product_name='ClearView Instant Print Cam';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/clearview-instant-print-cam-view-2.webp',2 FROM PRODUCT WHERE product_name='ClearView Instant Print Cam';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/powercore-10000-power-bank.webp',1 FROM PRODUCT WHERE product_name='PowerCore 10000 Power Bank';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/powercore-10000-power-bank-view-2.webp',2 FROM PRODUCT WHERE product_name='PowerCore 10000 Power Bank';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/powercore-wireless-charger-pad.webp',1 FROM PRODUCT WHERE product_name='PowerCore Wireless Charger Pad';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/powercore-wireless-charger-pad-view-2.webp',2 FROM PRODUCT WHERE product_name='PowerCore Wireless Charger Pad';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/cablepro-usb-c-cable-2m.webp',1 FROM PRODUCT WHERE product_name='CablePro USB-C Cable 2m';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/cablepro-usb-c-cable-2m-view-2.webp',2 FROM PRODUCT WHERE product_name='CablePro USB-C Cable 2m';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/casepro-phone-case-universal.webp',1 FROM PRODUCT WHERE product_name='CasePro Phone Case Universal';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/casepro-phone-case-universal-view-2.webp',2 FROM PRODUCT WHERE product_name='CasePro Phone Case Universal';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/brightblocks-starter-set.webp',1 FROM PRODUCT WHERE product_name='BrightBlocks Starter Set';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/brightblocks-starter-set-view-2.webp',2 FROM PRODUCT WHERE product_name='BrightBlocks Starter Set';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/brightblocks-mega-set.webp',1 FROM PRODUCT WHERE product_name='BrightBlocks Mega Set';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/brightblocks-mega-set-view-2.webp',2 FROM PRODUCT WHERE product_name='BrightBlocks Mega Set';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zoomracer-rc-car.webp',1 FROM PRODUCT WHERE product_name='ZoomRacer RC Car';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zoomracer-rc-car-view-2.webp',2 FROM PRODUCT WHERE product_name='ZoomRacer RC Car';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zoomracer-rc-truck.webp',1 FROM PRODUCT WHERE product_name='ZoomRacer RC Truck';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/zoomracer-rc-truck-view-2.webp',2 FROM PRODUCT WHERE product_name='ZoomRacer RC Truck';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/learnspark-coding-robot.webp',1 FROM PRODUCT WHERE product_name='LearnSpark Coding Robot';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/learnspark-coding-robot-view-2.webp',2 FROM PRODUCT WHERE product_name='LearnSpark Coding Robot';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/learnspark-math-puzzle-set.webp',1 FROM PRODUCT WHERE product_name='LearnSpark Math Puzzle Set';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/learnspark-math-puzzle-set-view-2.webp',2 FROM PRODUCT WHERE product_name='LearnSpark Math Puzzle Set';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/smartkid-tablet-jr.webp',1 FROM PRODUCT WHERE product_name='SmartKid Tablet Jr';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/smartkid-tablet-jr-view-2.webp',2 FROM PRODUCT WHERE product_name='SmartKid Tablet Jr';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/smartkid-globe-explorer.webp',1 FROM PRODUCT WHERE product_name='SmartKid Globe Explorer';
INSERT IGNORE INTO PRODUCT_IMAGE(product_id,file_path,sort_order) SELECT product_id,'/products/smartkid-globe-explorer-view-2.webp',2 FROM PRODUCT WHERE product_name='SmartKid Globe Explorer';
