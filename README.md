<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Tiệm%20Nước%20Nhỏ&fontSize=50&fontAlignY=35&desc=Small%20Drink%20Shop%20Management%20System&descAlignY=55&descAlign=50" alt="Banner" />
  
  # 🧋 Tiệm Nước Nhỏ (Small Drink Shop)
  
  [![Release](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/LongLeo287/Tiem_Nuoc_Nho/releases)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/LongLeo287/Tiem_Nuoc_Nho/pulls)
  [![Status](https://img.shields.io/badge/Status-Active-success.svg)]()

  *Hệ thống quản lý tinh gọn, tiện lợi và tối ưu dành cho các quán nước quy mô nhỏ.* <br>
  *A compact, convenient, and optimized management system for small beverage shops.*
</div>

---

## 📖 Giới thiệu | Introduction

<details>
<summary>🇻🇳 <b>Đọc bằng Tiếng Việt</b> (Nhấn để mở rộng)</summary>

<br>

**Tiệm Nước Nhỏ** là một dự án phần mềm được thiết kế dành riêng cho các quán nước, tiệm cafe quy mô nhỏ. Hệ thống tập trung vào việc quản lý thực đơn, theo dõi tình trạng nguyên liệu nhanh chóng và tối ưu hóa quy trình gọi món cho nhân viên. Triết lý của dự án là **"Đơn giản hóa để tăng tốc độ"**, loại bỏ những tính năng dư thừa không cần thiết.

</details>

<details>
<summary>🇬🇧 <b>Read in English</b> (Click to expand)</summary>

<br>

**Small Drink Shop** is a software project designed specifically for small beverage shops and cafes. The system focuses on menu management, quick ingredient tracking, and optimizing the ordering process for staff. The philosophy of the project is **"Simplify for speed"**, eliminating unnecessary and complex features.

</details>

---

## ✨ Tính năng nổi bật | Key Features

| Tính năng / Feature | Mô tả / Description |
| :--- | :--- |
| 📝 **Quản lý Menu** | Thêm, sửa, xóa các món nước dễ dàng với giao diện trực quan. / *Easily manage drinks with an intuitive interface.* |
| 📦 **Kiểm soát Tồn kho** | Trạng thái `co_san` giúp theo dõi món nào còn hàng/nguyên liệu ngay lập tức. / *Inventory tracking using the `co_san` flag.* |
| ⚡ **Tối ưu Tốc độ** | Lược bỏ các tùy chọn phức tạp (`has_customizations`) để nhân viên thao tác lên đơn trong 1 giây. / *Optimized ordering speed by disabling complex customizations.* |
| 📊 **Thống kê (Sắp ra mắt)** | Theo dõi doanh thu và món bán chạy nhất trong ngày. / *Track daily revenue and best-selling items.* |

---

## 🚀 Hướng dẫn Cài đặt & Sử dụng | Getting Started

Để tránh làm file README quá dài, phần hướng dẫn cài đặt và giải thích Code được chia thành các tab dưới đây. / *To keep the README clean, installation instructions and code logic are collapsed below.*

<details>
<summary><b>🛠 1. Cài đặt & Khởi chạy (Installation & Setup)</b></summary>
<br>

```bash
# 1. Clone repository
git clone [https://github.com/LongLeo287/Tiem_Nuoc_Nho.git](https://github.com/LongLeo287/Tiem_Nuoc_Nho.git)

# 2. Di chuyển vào thư mục dự án
cd Tiem_Nuoc_Nho

# 3. Cài đặt các thư viện/phụ thuộc (Tùy thuộc vào Framework bạn dùng)
npm install   # Hoặc yarn install / flutter pub get / pip install -r requirements.txt

# 4. Chạy ứng dụng môi trường dev
npm run dev
