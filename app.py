import streamlit as st

# Cấu hình tiêu đề trang trên tab trình duyệt
st.set_page_config(
    page_title="Đền Tổ Nghề Taxi Việt Nam",
    page_icon="🚖",
    layout="wide",
)

# Đọc nội dung từ file index.html
try:
  with open("index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

  # Hiển thị trang web HTML lên Streamlit
  st.components.v1.html(html_content, height=900, scrolling=True)
except FileNotFoundError:
  st.error(
      "Không tìm thấy file index.html. Anh vui lòng kiểm tra lại vị trí file"
      " nhé!"
  )
