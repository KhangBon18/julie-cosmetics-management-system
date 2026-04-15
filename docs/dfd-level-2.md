# DFD muc 2 - Julie Cosmetics

Tai lieu nay gom 20 so do DFD muc 2, boc tach tu DFD muc 1 cua cac module: Storefront, Ban hang & CRM, Kho, Nhan su. Moi so do la DFD muc 2 cho mot tien trinh muc 1 tu DFD muc 0.

## 1. Storefront va don hang online (P1)

### 1.1 Dang ky, dang nhap va ho so khach hang

```mermaid
flowchart LR
    KH[Khach hang]

    P111((1.1.1 Tiep nhan dang ky))
    P112((1.1.2 Xac thuc dang nhap))
    P113((1.1.3 Cap nhat ho so))
    P114((1.1.4 Quan ly phien dang nhap))

    D1[(D1 Khach hang)]

    KH -->|Thong tin dang ky| P111
    P111 -->|Tao tai khoan| D1
    KH -->|Thong tin dang nhap| P112
    D1 -->|Ho so tai khoan| P112
    P112 -->|Ket qua xac thuc| KH
    KH -->|Yeu cau cap nhat ho so| P113
    P113 -->|Cap nhat ho so| D1
    P113 -->|Ho so moi| KH
    P112 -->|Token/phien| P114
    P114 -->|Trang thai dang nhap| KH
```

### 1.2 Tra cuu danh muc va danh sach san pham

```mermaid
flowchart LR
    KH[Khach hang]

    P121((1.2.1 Tiep nhan yeu cau tra cuu))
    P122((1.2.2 Lay danh muc va thuong hieu))
    P123((1.2.3 Tim kiem va loc san pham))
    P124((1.2.4 Sap xep va phan trang))
    P125((1.2.5 Tra ve danh sach))

    D2[(D2 Danh muc san pham)]

    KH -->|Tu khoa, bo loc| P121
    P121 --> P122
    D2 -->|Danh muc, thuong hieu, san pham| P122
    P122 --> P123
    P123 --> P124
    P124 --> P125
    P125 -->|Danh sach san pham| KH
```

### 1.3 Xem chi tiet san pham va danh gia

```mermaid
flowchart LR
    KH[Khach hang]

    P131((1.3.1 Yeu cau xem chi tiet))
    P132((1.3.2 Lay thong tin san pham))
    P133((1.3.3 Lay hinh anh va thuoc tinh))
    P134((1.3.4 Lay danh gia hien thi))
    P135((1.3.5 De xuat san pham lien quan))
    P136((1.3.6 Tra ve chi tiet))

    D2[(D2 Danh muc san pham)]
    D4[(D4 Hoa don - khuyen mai - danh gia)]

    KH -->|Yeu cau xem chi tiet| P131
    P131 --> P132
    D2 -->|San pham, gia, ton| P132
    P132 --> P133
    D2 -->|Hinh anh, thuoc tinh| P133
    P133 --> P134
    D4 -->|Danh gia hien thi| P134
    P134 --> P135
    D2 -->|San pham lien quan| P135
    P135 --> P136
    P136 -->|Chi tiet san pham| KH
```

### 1.4 Quan ly gio hang va kiem tra ton

```mermaid
flowchart LR
    KH[Khach hang]

    P141((1.4.1 Them/sua/xoa gio hang))
    P142((1.4.2 Tinh tong tam))
    P143((1.4.3 Kiem tra ton kho))
    P144((1.4.4 Dieu chinh so luong))
    P145((1.4.5 Tra ve gio hang hop le))

    D2[(D2 Danh muc san pham)]

    KH -->|Thao tac gio hang| P141
    P141 --> P142
    P142 --> P143
    D2 -->|Gia ban, ton kho| P143
    P143 --> P144
    P144 --> P145
    P145 -->|Gio hang hop le/canh bao| KH
```

### 1.5 Checkout va tao don hang online

```mermaid
flowchart LR
    KH[Khach hang]

    P151((1.5.1 Tiep nhan thong tin giao hang))
    P152((1.5.2 Kiem tra khuyen mai))
    P153((1.5.3 Chot gia va ton kho))
    P154((1.5.4 Tao hoa don online))
    P155((1.5.5 Tao giao dich thanh toan))
    P156((1.5.6 Tao don giao hang))
    P157((1.5.7 Tra ve xac nhan))

    D1[(D1 Khach hang)]
    D2[(D2 Danh muc san pham)]
    D4[(D4 Hoa don - khuyen mai - danh gia)]
    D5[(D5 Thanh toan - giao hang)]

    KH -->|Dia chi, ghi chu| P151
    D1 -->|Ho so khach hang| P151
    P151 --> P152
    D4 -->|Ma khuyen mai| P152
    P152 --> P153
    D2 -->|Gia ban, ton| P153
    P153 --> P154
    P154 -->|Hoa don + chi tiet| D4
    P154 --> P155
    P155 -->|Giao dich thanh toan| D5
    P155 --> P156
    P156 -->|Don giao hang| D5
    P156 --> P157
    P157 -->|Ma don, tong tien| KH
```

## 2. Quan ly nhan su noi bo (P5)

### 5.1 Quan ly ho so nhan vien

```mermaid
flowchart LR
    QL[Quan ly / Admin]

    P511((5.1.1 Tiep nhan thong tin nhan vien))
    P512((5.1.2 Kiem tra trung lap))
    P513((5.1.3 Tao/cap nhat ho so))
    P514((5.1.4 Tao tai khoan dang nhap))
    P515((5.1.5 Tra ve danh sach))

    D11[(D11 Ho so nhan vien)]
    D16[(D16 Tai khoan nguoi dung)]

    QL -->|Thong tin nhan vien| P511
    P511 --> P512
    D11 -->|Danh sach hien co| P512
    P512 --> P513
    P513 -->|Luu ho so| D11
    P513 --> P514
    P514 -->|Tao user| D16
    P513 --> P515
    P515 -->|Danh sach/ho so| QL
```

### 5.2 Quan ly chuc vu va lich su cong tac

```mermaid
flowchart LR
    QL[Quan ly / Admin]

    P521((5.2.1 Khai bao chuc vu))
    P522((5.2.2 Gan chuc vu cho nhan vien))
    P523((5.2.3 Luu lich su chuc vu))
    P524((5.2.4 Tra ve thong tin chuc vu))

    D11[(D11 Ho so nhan vien)]
    D12[(D12 Danh muc chuc vu)]
    D13[(D13 Lich su chuc vu)]

    QL -->|Thong tin chuc vu| P521
    P521 -->|Cap nhat chuc vu| D12
    QL -->|Quyet dinh bo nhiem| P522
    D12 -->|Chuc vu hop le| P522
    P522 -->|Cap nhat nhan vien| D11
    P522 --> P523
    P523 -->|Luu lich su| D13
    P523 --> P524
    P524 -->|Chuc vu hien tai| QL
```

### 5.3 Tiep nhan va xu ly nghi phep

```mermaid
flowchart LR
    NV[Nhan vien]
    QL[Quan ly / Admin]

    P531((5.3.1 Nhan don nghi))
    P532((5.3.2 Kiem tra thong tin nhan vien))
    P533((5.3.3 Kiem tra han muc nghi))
    P534((5.3.4 Phe duyet/tu choi))
    P535((5.3.5 Cap nhat trang thai don))
    P536((5.3.6 Gui thong bao))

    D11[(D11 Ho so nhan vien)]
    D14[(D14 Don nghi phep)]
    D17[(D17 Thong bao)]

    NV -->|Don nghi| P531
    P531 --> P532
    D11 -->|Thong tin nhan vien| P532
    P532 --> P533
    D14 -->|Lich su nghi| P533
    QL -->|Quyet dinh| P534
    P533 --> P534
    P534 --> P535
    P535 -->|Cap nhat don nghi| D14
    P535 --> P536
    P536 -->|Thong bao| D17
    D17 -->|Ket qua don nghi| NV
```

### 5.4 Tinh va quan ly bang luong

```mermaid
flowchart LR
    QL[Quan ly / Admin]

    P541((5.4.1 Chon ky luong))
    P542((5.4.2 Tong hop cong va nghi))
    P543((5.4.3 Lay he so/chuc vu))
    P544((5.4.4 Tinh luong))
    P545((5.4.5 Luu bang luong))
    P546((5.4.6 Tra ve bang luong))

    D11[(D11 Ho so nhan vien)]
    D13[(D13 Lich su chuc vu)]
    D14[(D14 Don nghi phep)]
    D15[(D15 Bang luong)]
    D18[(D18 Cau hinh cong chuan)]

    QL -->|Ky luong| P541
    P541 --> P542
    D11 -->|Nhan vien| P542
    D14 -->|Ngay nghi| P542
    P542 --> P543
    D13 -->|Chuc vu| P543
    D18 -->|Cong chuan| P543
    P543 --> P544
    P544 --> P545
    P545 -->|Bang luong| D15
    P545 --> P546
    P546 -->|Bang luong ky| QL
```

### 5.5 Tu phuc vu nhan vien

```mermaid
flowchart LR
    NV[Nhan vien]

    P551((5.5.1 Dang nhap noi bo))
    P552((5.5.2 Xem ho so ca nhan))
    P553((5.5.3 Xem lich su nghi))
    P554((5.5.4 Xem bang luong))
    P555((5.5.5 Xem thong bao))

    D11[(D11 Ho so nhan vien)]
    D14[(D14 Don nghi phep)]
    D15[(D15 Bang luong)]
    D16[(D16 Tai khoan nguoi dung)]
    D17[(D17 Thong bao)]

    NV -->|Thong tin dang nhap| P551
    D16 -->|Tai khoan| P551
    P551 -->|Dang nhap thanh cong| NV
    NV -->|Yeu cau ho so| P552
    D11 -->|Ho so| P552
    P552 -->|Ho so ca nhan| NV
    NV -->|Yeu cau nghi| P553
    D14 -->|Lich su nghi| P553
    P553 -->|Ket qua| NV
    NV -->|Yeu cau bang luong| P554
    D15 -->|Bang luong| P554
    P554 -->|Thong tin luong| NV
    D17 -->|Thong bao| P555
    P555 -->|Thong bao moi| NV
```

## 3. Quan ly kho va nhap hang (P4)

### 4.1 Quan ly san pham

```mermaid
flowchart LR
    TK[Thu kho]
    QL[Quan ly / Admin]

    P411((4.1.1 Tiep nhan thong tin san pham))
    P412((4.1.2 Kiem tra danh muc/thuong hieu))
    P413((4.1.3 Tao/cap nhat san pham))
    P414((4.1.4 Danh sach va canh bao))

    D21[(D21 San pham)]
    D22[(D22 Danh muc)]
    D23[(D23 Thuong hieu)]

    TK -->|Thong tin san pham| P411
    QL -->|Yeu cau cap nhat| P411
    P411 --> P412
    D22 -->|Danh muc| P412
    D23 -->|Thuong hieu| P412
    P412 --> P413
    P413 -->|Cap nhat san pham| D21
    D21 -->|Danh sach ton| P414
    P414 -->|Danh sach/canh bao| TK
```

### 4.2 Quan ly danh muc va thuong hieu

```mermaid
flowchart LR
    TK[Thu kho]
    QL[Quan ly / Admin]

    P421((4.2.1 Tao/cap nhat danh muc))
    P422((4.2.2 Tao/cap nhat thuong hieu))
    P423((4.2.3 Phe duyet thay doi))
    P424((4.2.4 Tra ve danh muc/thuong hieu))

    D22[(D22 Danh muc)]
    D23[(D23 Thuong hieu)]

    TK -->|Thong tin danh muc| P421
    P421 -->|Cap nhat| D22
    TK -->|Thong tin thuong hieu| P422
    P422 -->|Cap nhat| D23
    QL -->|Phe duyet| P423
    P423 --> P424
    D22 -->|Danh muc| P424
    D23 -->|Thuong hieu| P424
    P424 -->|Ket qua cap nhat| TK
```

### 4.3 Quan ly nha cung cap

```mermaid
flowchart LR
    NCC[Nha cung cap]
    TK[Thu kho]

    P431((4.3.1 Tiep nhan thong tin NCC))
    P432((4.3.2 Kiem tra trung lap))
    P433((4.3.3 Tao/cap nhat NCC))
    P434((4.3.4 Tra ve danh sach NCC))

    D24[(D24 Nha cung cap)]

    NCC -->|Thong tin NCC| P431
    TK -->|Nhap thong tin| P431
    P431 --> P432
    D24 -->|Danh sach NCC| P432
    P432 --> P433
    P433 -->|Cap nhat NCC| D24
    D24 -->|Danh sach NCC| P434
    P434 -->|Ket qua| TK
```

### 4.4 Lap va xu ly phieu nhap

```mermaid
flowchart LR
    TK[Thu kho]
    NCC[Nha cung cap]

    P441((4.4.1 Tao phieu nhap))
    P442((4.4.2 Doi chieu nha cung cap))
    P443((4.4.3 Ghi chi tiet nhap))
    P444((4.4.4 Cap nhat ton kho))
    P445((4.4.5 Ghi nhan bien dong))
    P446((4.4.6 Tra ve phieu nhap))

    D24[(D24 Nha cung cap)]
    D25[(D25 Phieu nhap)]
    D26[(D26 Chi tiet phieu nhap)]
    D21[(D21 San pham)]
    D27[(D27 Bien dong ton kho)]

    TK -->|Thong tin nhap| P441
    P441 -->|Phieu nhap| D25
    NCC -->|Hang giao/chung tu| P442
    D24 -->|Thong tin NCC| P442
    P441 --> P443
    P443 -->|Chi tiet nhap| D26
    P443 --> P444
    D21 -->|Ton hien tai| P444
    P444 -->|Cap nhat ton| D21
    P444 --> P445
    P445 -->|Bien dong kho| D27
    P441 --> P446
    P446 -->|Phieu nhap da lap| TK
```

### 4.5 Kiem soat ton kho

```mermaid
flowchart LR
    TK[Thu kho]
    QL[Quan ly / Admin]

    P451((4.5.1 Tiep nhan yeu cau bao cao))
    P452((4.5.2 Tong hop ton hien tai))
    P453((4.5.3 Tong hop bien dong kho))
    P454((4.5.4 Canh bao sap het))
    P455((4.5.5 Tra ve bao cao ton))

    D21[(D21 San pham)]
    D25[(D25 Phieu nhap)]
    D26[(D26 Chi tiet phieu nhap)]
    D27[(D27 Bien dong ton kho)]

    TK -->|Yeu cau bao cao| P451
    QL -->|Yeu cau kiem soat| P451
    P451 --> P452
    D21 -->|Ton hien tai| P452
    P452 --> P453
    D25 -->|Phieu nhap| P453
    D26 -->|Chi tiet nhap| P453
    D27 -->|Bien dong| P453
    P453 --> P454
    P454 --> P455
    P455 -->|Bao cao ton| TK
    P455 -->|Thong tin ton| QL
```

## 4. Ban hang va CRM (P2)

### 2.1 Quan ly khach hang va CRM

```mermaid
flowchart LR
    KH[Khach hang]
    NVBH[Nhan vien ban hang]

    P211((2.1.1 Tiep nhan thong tin KH))
    P212((2.1.2 Tra cuu ho so KH))
    P213((2.1.3 Cap nhat ho so KH))
    P214((2.1.4 Tong hop lich su mua))
    P215((2.1.5 Tinh hang/diem))
    P216((2.1.6 Tra ve thong tin CRM))

    D31[(D31 Khach hang)]
    D32[(D32 Hoa don)]
    D33[(D33 Chi tiet hoa don)]

    KH -->|Thong tin ca nhan| P211
    NVBH -->|Yeu cau tra cuu| P211
    P211 --> P212
    D31 -->|Ho so KH| P212
    P212 --> P213
    P213 -->|Cap nhat ho so| D31
    P212 --> P214
    D32 -->|Hoa don| P214
    D33 -->|Chi tiet| P214
    P214 --> P215
    P215 -->|Hang/diem| D31
    P215 --> P216
    P216 -->|Thong tin CRM| NVBH
```

### 2.2 Lap va quan ly hoa don

```mermaid
flowchart LR
    KH[Khach hang]
    NVBH[Nhan vien ban hang]

    P221((2.2.1 Chon KH va san pham))
    P222((2.2.2 Kiem tra gia va ton))
    P223((2.2.3 Tinh tong tien))
    P224((2.2.4 Tao hoa don))
    P225((2.2.5 Tao chi tiet hoa don))
    P226((2.2.6 Tra ve hoa don))

    D31[(D31 Khach hang)]
    D32[(D32 Hoa don)]
    D33[(D33 Chi tiet hoa don)]
    D310[(D310 San pham va ton kho)]

    NVBH -->|Thong tin ban hang| P221
    KH -->|Yeu cau mua| P221
    D31 -->|Ho so KH| P221
    P221 --> P222
    D310 -->|Gia ban, ton| P222
    P222 --> P223
    P223 --> P224
    P224 -->|Hoa don| D32
    P224 --> P225
    P225 -->|Chi tiet| D33
    P225 --> P226
    P226 -->|Hoa don/chi tiet| KH
```

### 2.3 Quan ly khuyen mai va danh gia

```mermaid
flowchart LR
    QL[Quan ly / Admin]
    NVBH[Nhan vien ban hang]

    P231((2.3.1 Tao/cap nhat CTKM))
    P232((2.3.2 Kiem tra ap dung CTKM))
    P233((2.3.3 Kiem duyet danh gia))
    P234((2.3.4 Gan danh gia cho san pham))
    P235((2.3.5 Tra ve trang thai))

    D34[(D34 Khuyen mai)]
    D35[(D35 Danh gia)]
    D310[(D310 San pham va ton kho)]

    QL -->|Thong tin CTKM| P231
    P231 -->|Cap nhat| D34
    NVBH -->|Kiem tra CTKM| P232
    D34 -->|Chuong trinh| P232
    P232 --> P235
    QL -->|Kiem duyet danh gia| P233
    P233 -->|Cap nhat danh gia| D35
    P233 --> P234
    D310 -->|San pham| P234
    P234 --> P235
    P235 -->|Trang thai CTKM/danh gia| QL
```

### 2.4 Xu ly thanh toan va giao hang

```mermaid
flowchart LR
    NVBH[Nhan vien ban hang]
    TT[Kenh thanh toan]
    VC[Don vi van chuyen]

    P241((2.4.1 Tao yeu cau thanh toan))
    P242((2.4.2 Gui thong tin thanh toan))
    P243((2.4.3 Nhan ket qua giao dich))
    P244((2.4.4 Tao don giao hang))
    P245((2.4.5 Cap nhat trang thai giao hang))
    P246((2.4.6 Cap nhat hoa don))

    D32[(D32 Hoa don)]
    D36[(D36 Giao dich thanh toan)]
    D37[(D37 Don giao hang)]

    NVBH -->|Yeu cau thanh toan| P241
    P241 -->|Ghi giao dich| D36
    P241 --> P242
    P242 -->|Thong tin thanh toan| TT
    TT -->|Ket qua giao dich| P243
    P243 --> P246
    P246 -->|Trang thai hoa don| D32
    P243 --> P244
    P244 -->|Tao don giao| D37
    P244 -->|Thong tin giao hang| VC
    VC -->|Trang thai giao hang| P245
    P245 -->|Cap nhat don giao| D37
    P245 -->|Thong tin giao hang| NVBH
```

### 2.5 Xu ly doi tra

```mermaid
flowchart LR
    KH[Khach hang]
    NVBH[Nhan vien ban hang]
    QL[Quan ly / Admin]

    P251((2.5.1 Tiep nhan yeu cau doi/tra))
    P252((2.5.2 Kiem tra dieu kien hoa don))
    P253((2.5.3 Phe duyet/tu choi))
    P254((2.5.4 Lap ho so doi tra))
    P255((2.5.5 Hoan tien))
    P256((2.5.6 Hoan kho))
    P257((2.5.7 Tra ve ket qua))

    D32[(D32 Hoa don)]
    D33[(D33 Chi tiet hoa don)]
    D36[(D36 Giao dich thanh toan)]
    D38[(D38 Yeu cau doi tra)]
    D39[(D39 Chi tiet doi tra)]
    D310[(D310 San pham va ton kho)]

    KH -->|Yeu cau doi/tra| P251
    NVBH -->|Tiep nhan| P251
    P251 --> P252
    D32 -->|Hoa don| P252
    D33 -->|Chi tiet| P252
    QL -->|Quyet dinh| P253
    P252 --> P253
    P253 --> P254
    P254 -->|Ho so doi tra| D38
    P254 -->|Chi tiet doi tra| D39
    P253 --> P255
    P255 -->|Hoan tien| D36
    P253 --> P256
    P256 -->|Hoan kho| D310
    P254 --> P257
    P257 -->|Ket qua| KH
```
