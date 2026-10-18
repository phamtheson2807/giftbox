# Vũ Trụ Tình Yêu

Một món quà web tương tác dành cho ngày Phụ nữ Việt Nam 20/10: bó hoa biến thành những bức ảnh kỷ niệm, thiệp lời chúc và trái tim sao đang đập.

## Chạy trên máy

```bash
python3 -m http.server 8000
```

Sau đó mở <http://localhost:8000> trong trình duyệt. Nhấn giữ bó hoa để mở ảnh, đọc thiệp rồi tiếp tục tới màn trái tim và dòng ảnh kỷ niệm.

## Quản trị lời chúc và ảnh

Mở <http://localhost:8000/admin.html>, nhập tối đa 8 dòng lời chúc rồi chọn **Lưu lời chúc**. Nếu trang chính đang mở trong một tab khác, nội dung thiệp sẽ được cập nhật ngay.

Trang quản trị cho phép chọn tối đa 6 ảnh JPEG, PNG hoặc WebP và nhập các dòng lời chúc. Ảnh sẽ xuất hiện trong bó hoa sau thao tác nhấn giữ, rồi bay bên dưới trái tim ở màn cuối; các dòng chữ sẽ được trình bày trên tấm thiệp 20/10.

Phiên bản GitHub Pages lưu lời nhắn bằng `localStorage`, vì vậy trang quản trị và trang chính cần được mở trên cùng trình duyệt và thiết bị. Đây là giải pháp không cần máy chủ, phù hợp với hosting tĩnh; nếu cần quản trị nội dung cho mọi khách truy cập, dự án sẽ cần kết nối thêm một dịch vụ cơ sở dữ liệu.

## Đưa lên GitHub Pages

Dự án chỉ dùng HTML, CSS và JavaScript tĩnh nên có thể chạy trực tiếp trên GitHub Pages. Workflow trong `.github/workflows/deploy-pages.yml` sẽ tự động triển khai mỗi khi có commit mới trên nhánh `main` hoặc `work`.

1. Đẩy repository lên GitHub.
2. Mở **Settings → Pages**.
3. Trong **Build and deployment → Source**, chọn **GitHub Actions**.
4. Đẩy một commit lên `main` hoặc chạy workflow **Deploy to GitHub Pages** thủ công trong tab **Actions**.
5. Khi workflow hoàn thành, website sẽ có địa chỉ dạng `https://<username>.github.io/<repository>/`.

Các đường dẫn asset đều là đường dẫn tương đối, vì vậy website hoạt động cả ở domain gốc và GitHub Pages dạng project site.
