# Vũ Trụ Tình Yêu

Một trải nghiệm web animation mô phỏng trái tim 3D đang đập, được kết thành từ hàng ngàn ngôi sao lấp lánh giữa thiên hà.

## Chạy trên máy

```bash
python3 -m http.server 8000
```

Sau đó mở <http://localhost:8000> trong trình duyệt. Kéo chuột hoặc vuốt để xoay trái tim và nhấn nút để tạo hiệu ứng yêu thương.

## Quản trị lời nhắn

Mở <http://localhost:8000/admin.html>, nhập tối đa 8 lời nhắn (mỗi dòng là một lời nhắn) rồi chọn **Gửi vào thiên hà**. Nếu trang chính đang mở trong một tab khác, nội dung quanh hố sao sẽ được cập nhật ngay.

Phiên bản GitHub Pages lưu lời nhắn bằng `localStorage`, vì vậy trang quản trị và trang chính cần được mở trên cùng trình duyệt và thiết bị. Đây là giải pháp không cần máy chủ, phù hợp với hosting tĩnh; nếu cần quản trị nội dung cho mọi khách truy cập, dự án sẽ cần kết nối thêm một dịch vụ cơ sở dữ liệu.

## Đưa lên GitHub Pages

Dự án chỉ dùng HTML, CSS và JavaScript tĩnh nên có thể chạy trực tiếp trên GitHub Pages. Workflow trong `.github/workflows/deploy-pages.yml` sẽ tự động triển khai mỗi khi có commit mới trên nhánh `main` hoặc `work`.

1. Đẩy repository lên GitHub.
2. Mở **Settings → Pages**.
3. Trong **Build and deployment → Source**, chọn **GitHub Actions**.
4. Đẩy một commit lên `main` hoặc chạy workflow **Deploy to GitHub Pages** thủ công trong tab **Actions**.
5. Khi workflow hoàn thành, website sẽ có địa chỉ dạng `https://<username>.github.io/<repository>/`.

Các đường dẫn asset đều là đường dẫn tương đối, vì vậy website hoạt động cả ở domain gốc và GitHub Pages dạng project site.
