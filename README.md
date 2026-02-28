<div align="center">

<!-- Banner Chuyên Nghiệp -->

<img src="https://www.google.com/search?q=https://capsule-render.vercel.app/api%3Ftype%3Dwaving%26color%3D00b4d8%26height%3D250%26section%3Dheader%26text%3DTi%E1%BB%87m%2520N%C6%B0%E1%BB%9Bc%2520Nh%E1%BB%8F%26fontSize%3D70%26animation%3DfadeIn%26fontAlignY%3D35%26desc%3DH%E1%BB%87%2520th%E1%BB%91ng%2520Qu%E1%BA%A3n%2520l%C3%BD%2520B%C3%A1n%2520h%C3%A0ng%2520Tinh%2520g%E1%BB%8Dn%26descAlignY%3D55%26descAlign%3D50" width="100%" />

<br />

Giải pháp quản lý tối ưu cho các mô hình quán nước, cafe vừa và nhỏ. A minimalist management solution for small and medium-sized beverage shops.

🌐 Live Demo • 📑 Tài liệu • 🐞 Báo lỗi

</div>

📖 Giới thiệu | Introduction

<details open>
<summary><b>🇻🇳 Tiếng Việt (Bấm để thu gọn)</b></summary>




Tiệm Nước Nhỏ không chỉ là một ứng dụng bán hàng thông thường. Đây là một hệ thống được thiết kế đặc biệt cho môi trường vận hành nhanh, nơi mà mỗi giây thao tác của nhân viên đều quý giá. Hệ thống loại bỏ các quy trình rườm rà, tập trung vào việc hiển thị trực quan tình trạng hàng hóa và tối ưu hóa quy trình lên đơn.

Điểm nhấn:

⚡ Tốc độ: Lên đơn cực nhanh với các món đóng chai/bán ngay.

📦 Kiểm soát: Theo dõi tồn kho thực tế qua biến trạng thái thông minh.

</details>

<details>
<summary><b>🇬🇧 English (Click to expand)</b></summary>




Tiem Nuoc Nho is more than just a standard POS application. It is a system specifically designed for fast-paced operational environments where every second of staff interaction is valuable. The system eliminates cumbersome processes, focusing on intuitive stock visibility and optimized ordering workflows.

Highlights:

⚡ Speed: Ultra-fast ordering for bottled or ready-to-serve items.

📦 Control: Real-time inventory tracking via smart state variables.

</details>

✨ Tính năng chính | Key Features

🚀 Tính năng / Features

📝 Mô tả / Description

Menu Management

Quản lý linh hoạt: Nước pha chế, đồ đóng chai, thuốc lá...

Real-time Stock

Tự động cập nhật trạng thái món dựa trên biến co_san.

Optimized UI

Giao diện tối giản, hỗ trợ tốt trên cả máy tính và máy tính bảng.

Fast Checkout

Lược bỏ các bước chọn option (has_customizations) cho các món bán liền.

🛠 Công nghệ sử dụng | Tech Stack

<div align="left">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/JavaScript-F7DF1E%3Fstyle%3Dfor-the-badge%26logo%3Djavascript%26logoColor%3Dblack" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/React-61DAFB%3Fstyle%3Dfor-the-badge%26logo%3Dreact%26logoColor%3Dblack" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Tailwind_CSS-38B2AC%3Fstyle%3Dfor-the-badge%26logo%3Dtailwind-css%26logoColor%3Dwhite" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Node.js-339933%3Fstyle%3Dfor-the-badge%26logo%3Dnodedotjs%26logoColor%3Dwhite" />
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Firebase-FFCA28%3Fstyle%3Dfor-the-badge%26logo%3Dfirebase%26logoColor%3Dblack" />
</div>

⚙️ Cơ chế vận hành | Core Logic

Dự án sử dụng các cờ (flags) dữ liệu đặc trưng để điều phối luồng bán hàng:

[!TIP]

1. Trạng thái co_san (Availability)

Khi true: Món hiển thị rực rỡ, sẵn sàng để khách chọn.

Khi false: Món tự động mờ đi hoặc ẩn, thông báo cho nhân viên là đã hết nguyên liệu hoặc hết hàng tồn kho.

2. Thuộc tính has_customizations (Option Settings)

Hệ thống phân loại món thành 2 nhóm:

Nhóm cần tinh chỉnh: (Cafe, Trà sữa...) Nhân viên sẽ chọn mức đường, đá.

Nhóm bán ngay: (Coca, Dừa trái, Thuốc lá...) Hệ thống bỏ qua bước chọn option, giúp hoàn tất đơn hàng chỉ sau 1 lần chạm.

🚀 Hướng dẫn sử dụng | Getting Started

<details>
<summary><b>📦 Bước 1: Cài đặt (Setup)</b></summary>




Tải mã nguồn về máy:

git clone [https://github.com/LongLeo287/Tiem_Nuoc_Nho.git](https://github.com/LongLeo287/Tiem_Nuoc_Nho.git)


Cài đặt các thư viện phụ thuộc:

cd Tiem_Nuoc_Nho
npm install


</details>

<details>
<summary><b>🏃‍♂️ Bước 2: Khởi chạy (Execution)</b></summary>




Chạy môi trường phát triển (Development):

npm run dev


Đóng gói sản phẩm (Build):

npm run build


</details>

📸 Hình ảnh dự án | Screenshots

<div align="center">
<img src="https://www.google.com/search?q=https://via.placeholder.com/800x400.png%3Ftext%3DTiem%2BNuoc%2BNho%2BDashboard" alt="Screenshot" />
<p><i>Giao diện chính tối ưu cho nhân viên đứng quầy</i></p>
</div>

🌟 Đánh giá & Phản hồi | Reviews

"Hệ thống cực kỳ ổn định, từ khi áp dụng logic has_customizations cho các món đóng chai, tốc độ phục vụ giờ cao điểm của quán tôi đã tăng rõ rệt!"

— Quản lý Tiệm Nước Nhỏ ⭐⭐⭐⭐⭐

🤝 Đóng góp | Contributing

Mọi ý tưởng mới đều được chào đón! Đừng ngần ngại giúp dự án phát triển hơn.

Fork dự án.

Tạo nhánh mới (git checkout -b feature/NewFeature).

Commit thay đổi (git commit -m 'Add some NewFeature').

Push lên nhánh (git push origin feature/NewFeature).

Mở một Pull Request.

⭐ Project Rating

Tặng mình một Star nếu bạn thấy dự án này thú vị nhé!

<div align="center">
<p><b>Thiết kế và phát triển bởi <a href="https://github.com/LongLeo287">LongLeo</a> ❤️</b></p>
<a href="https://github.com/LongLeo287">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Follow-LongLeo-black%3Fstyle%3Dfor-the-badge%26logo%3Dgithub" alt="Follow LongLeo" />
</a>
</div>
