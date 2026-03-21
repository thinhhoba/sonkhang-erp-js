/* ================================================================
 * sk-hrm-address.js — SonKhang ERP v3.8
 * Địa chỉ 2 cấp: Tỉnh/TP → Quận/Huyện
 * Địa giới hành chính 2025 (63 tỉnh/TP - sau khi sáp nhập)
 * 20/03/2026
 * ================================================================ */
(function(){
  'use strict';

  /* Dữ liệu địa giới hành chính VN 2025
   * Sau sáp nhập: còn 63 tỉnh/thành phố
   * Chỉ giữ cấp Tỉnh/TP → Quận/Huyện (level 1+2) */
  var _ADDR_DATA = {
    'Hà Nội': [
      'Ba Đình','Hoàn Kiếm','Tây Hồ','Long Biên','Cầu Giấy',
      'Đống Đa','Hai Bà Trưng','Hoàng Mai','Thanh Xuân',
      'Nam Từ Liêm','Bắc Từ Liêm','Hà Đông',
      'Sơn Tây','Ba Vì','Phúc Thọ','Đan Phượng',
      'Hoài Đức','Quốc Oai','Thạch Thất','Chương Mỹ',
      'Thanh Oai','Thường Tín','Phú Xuyên','Ụng Hòa',
      'Mỹ Đức','Mê Linh','Sóc Sơn','Đông Anh',
      'Gia Lâm'
    ],
    'TP. Hồ Chí Minh': [
      'Quận 1','Quận 3','Quận 4','Quận 5','Quận 6',
      'Quận 7','Quận 8','Quận 10','Quận 11','Quận 12',
      'Bình Thạnh','Gò Vấp','Phú Nhuận','Tân Bình',
      'Tân Phú','Ð Tân Sơn Nhất','Bình Tân',
      'Thủ Đức','Hóc Môn','Nhà Bè','Cần Giờ',
      'Củ Chi','Bình Chánh'
    ],
    'Đà Nẵng': [
      'Hải Châu','Thanh Khê','Sơn Trà','Ngũ Hành Sơn',
      'Liên Chiểu','Cẩm Lệ','Hòa Vang','Hoàng Sa'
    ],
    'Hải Phòng': [
      'Hồng Bàng','Lê Chân','Ngô Quyền','Kiến An',
      'Hải An','Đồ Sơn','Dương Kinh','Thuỷ Nguyên',
      'An Dương','An Lão','Kiến Thuỵ','Tiên Lãng',
      'Vĩnh Bảo','Cát Hải','Bạch Long Vĩ'
    ],
    'Cần Thơ': [
      'Ninh Kiều','Bình Thủy','Cái Răng','Ô Môn',
      'Thốt Nốt','Vinhlong', 'Phong Điền','Cờ Đỏ',
      'Thới Lai'
    ],
    'An Giang': ['Long Xuyên','Châu Đốc','An Phú','Tân Châu','Phú Tân','Châu Phú','Thoại Sơn','Châu Thành','Thoại Sơn'],
    'Bà Rịa – Vũng Tàu': ['Vũng Tàu','Bà Rịa','Xuân Lộc','Long Đất','Thành phố Đá Bạc','Xũ Long Hương'],
    'Bắc Giang': ['Bắc Giang','Sơn Động','Lạng Giang','Lục Ngạn','Lục Nam','Yên Thế','Hiệp Hòa','Tân Yên','Việt Yên','Yên Dũng'],
    'Bắc Kạn': ['Bắc Kạn','Ba Bể','Bạch Thông','Chợ Đồn','Chợ Mới','Na Rì','Ngân Sơn','Pác Nặm'],
    'Bạc Liêu': ['Bạc Liêu','Phước Long','Hồng Dân','Giá Rai','Vĩnh Lợi','Hòa Bình','Đông Hải'],
    'Bắc Ninh': ['Bắc Ninh','Từ Sơn','Yên Phong','Tiên Du','Quế Võ','Gia Bình','Thuận Thành','Lương Tài'],
    'Bến Tre': ['Bến Tre','Châu Thành','Giồng Trôm','Mỏ Cày Nam','Mỏ Cày Bắc','Thạnh Phú','Ba Tri','Bình Đại','Chợ Lách'],
    'Bình Dương': ['Thủ Dầu Một','Dĩ An','Thuận An','Tân Uyên','Bến Cát','Phú Giáo','Bắc Tân Uyên','Dầu Tiếng'],
    'Bình Định': ['Quy Nhơn','An Nhơn','Hoài Nhơn','Tây Sơn','Phù Cát','Phù Mỹ','Vĩnh Thạnh','An Lão','Hoài Ân','Vân Canh'],
    'Bình Phước': ['Đồng Xoài','Bình Long','Phước Long','Chơn Thành','Đồng Phú','Bù Đăng','Bù Gia Mập','Hớn Quản','Lộc Ninh'],
    'Bình Thuận': ['Phan Thiết','La Gi','Tuy Phong','Bắc Bình','Hàm Thuận Bắc','Hàm Thuận Nam','Hàm Tân','Tánh Linh','Đức Linh','Phú Quý'],
    'Cà Mau': ['Cà Mau','Thới Bình','U Minh','Trần Văn Thời','Cái Nước','Đầm Dơi','Năm Căn','Ngọc Hiển','Phú Tân'],
    'Cao Bằng': ['Cao Bằng','Bảo Lạc','Bảo Lâm','Hạ Lang','Hà Quảng','Hòa An','Nguyên Bình','Phục Hòa','Quảng Hòa','Thạch An','Trùng Khánh'],
    'Đắc Lắc': ['Buôn Ma Thuột','Buôn Hồ','Ea H\'leo','Ea Súp','Krông Ana','Krông Bông','Krông Búk','Krông Năng','Krông Pắc','Lắk','M\'Đrắk','Cư Kuin','Cư M\'gar'],
    'Đắc Nông': ['Gia Nghĩa','Cư Jút','Đắk Glong','Đắk Mil','Đắk R\'Lấp','Đắk Song','Krông Nô','Tuy Đức'],
    'Điện Biên': ['Điện Biên Phủ','Mường Lay','Điện Biên','Điện Biên Đông','Mường Ảng','Mường Chà','Mường Nhé','Nậm Pồ','Tủa Chùa','Tuần Giáo'],
    'Đồng Nai': ['Biên Hòa','Long Khánh','Cẩm Mỹ','Định Quán','Long Thành','Nhơn Trạch','Tân Phú','Thống Nhất','Trảng Bom','Vĩnh Cửu','Xuân Lộc'],
    'Đồng Tháp': ['Cao Lãnh','Sa Đéc','Hồng Ngự','Châu Thành','Hồng Ngự','Lai Vung','Lấp Vò','Tam Nông','Tân Hồng','Tháp Mười','Tân Châu'],
    'Gia Lai': ['Pleiku','An Khê','Ayun Pa','Chư Păh','Chư Prông','Chư Sê','Đắk Đoa','Đắk Pơ','Đức Cơ','Ia Grai','Ia Pa','KBang','Kông Chro','Krông Pa','Mang Yang','Phú Thiện'],
    'Hà Giang': ['Hà Giang','Bắc Mê','Bắc Quang','Đồng Văn','Hoàng Su Phì','Mèo Vạc','Quản Bạ','Quang Bình','Vị Xuyên','Xín Mần','Yên Minh'],
    'Hà Nam': ['Phủ Lý','Bình Lục','Duy Tiên','Kim Bảng','Lý Nhân','Thanh Liêm'],
    'Hà Tĩnh': ['Hà Tĩnh','Hồng Lĩnh','Cẩm Xuyên','Can Lộc','Đức Thọ','Hương Khê','Hương Sơn','Kỳ Anh','Lộc Hà','Nghi Xuân','Thạch Hà','Vũ Quang'],
    'Hậu Giang': ['Vị Thanh','Ngã Bảy','Châu Thành','Châu Thành A','Long Mỹ','Phụng Hiệp','Vị Thủy'],
    'Hòa Bình': ['Hòa Bình','Cao Phong','Đà Bắc','Kim Bôi','Kỳ Sơn','Lạc Sơn','Lạc Thủy','Lương Sơn','Mai Châu','Tân Lạc','Yên Thủy'],
    'Hưng Yên': ['Hưng Yên','Mỹ Hào','Ân Thi','Khoái Châu','Kim Động','Phù Cừ','Tiên Lữ','Văn Giang','Văn Lâm','Yên Mỹ'],
    'Khánh Hòa': ['Nha Trang','Cam Ranh','Ninh Hòa','Diên Khánh','Khánh Sơn','Khánh Vĩnh','Trường Sa','Vạn Ninh'],
    'Kiên Giang': ['Rạch Giá','Hà Tiên','An Biên','An Minh','Châu Thành','Giang Thành','Giồng Riềng','Gò Quao','Hòn Đất','Kiên Hải','Kiên Lương','Phú Quốc','Tân Hiệp','U Minh Thượng','Vĩnh Thuận'],
    'Kon Tum': ['Kon Tum','Đắk Glei','Đắk Hà','Đắk Tô','Ia H\'Drai','Kon Plông','Kon Rẫy','Ngọc Hồi','Sa Thầy','Tu Mơ Rông'],
    'Lai Châu': ['Lai Châu','Mường Tè','Nậm Nhùn','Phong Thổ','Sìn Hồ','Tam Đường','Tân Uyên','Than Uyên'],
    'Lâm Đồng': ['Đà Lạt','Bảo Lộc','Bảo Lâm','Cát Tiên','Đam Rông','Di Linh','Đơn Dương','Đức Trọng','Lạc Dương','Lâm Hà'],
    'Lạng Sơn': ['Lạng Sơn','Bắc Sơn','Bình Gia','Cao Lộc','Chi Lăng','Đình Lập','Hữu Lũng','Lộc Bình','Tràng Định','Văn Lãng','Văn Quan'],
    'Lào Cai': ['Lào Cai','Bắc Hà','Bảo Thắng','Bảo Yên','Bát Xát','Mường Khương','Sa Pa','Si Ma Cai','Văn Bàn'],
    'Long An': ['Tân An','Kiến Tường','Bến Lức','Cần Đước','Cần Giuộc','Châu Thành','Đức Hòa','Đức Huệ','Mộc Hóa','Tân Hưng','Tân Thạnh','Tân Trụ','Thạnh Hóa','Thủ Thừa','Vĩnh Hưng'],
    'Nam Định': ['Nam Định','Giao Thủy','Hải Hậu','Mỹ Lộc','Nam Trực','Nghĩa Hưng','Trực Ninh','Vụ Bản','Xuân Trường','Ý Yên'],
    'Nghệ An': ['Vinh','Cửa Lò','Hoàng Mai','Thái Hòa','Anh Sơn','Con Cuông','Diễn Châu','Đô Lương','Hưng Nguyên','Kỳ Sơn','Nam Đàn','Nghi Lộc','Nghĩa Đàn','Quế Phong','Quỳ Châu','Quỳ Hợp','Quỳnh Lưu','Tân Kỳ','Thanh Chương','Tương Dương','Yên Thành'],
    'Ninh Bình': ['Ninh Bình','Tam Điệp','Gia Viễn','Hoa Lư','Kim Sơn','Nho Quan','Yên Khánh','Yên Mô'],
    'Ninh Thuận': ['Phan Rang – Tháp Chàm','Bác Ái','Ninh Hải','Ninh Phước','Ninh Sơn','Thuận Bắc','Thuận Nam'],
    'Phú Thọ': ['Việt Trì','Phú Thọ','Cẩm Khê','Đoan Hùng','Hạ Hòa','Lâm Thao','Phù Ninh','Tam Nông','Tân Sơn','Thanh Ba','Thanh Sơn','Thanh Thủy','Yên Lập'],
    'Phú Yên': ['Tuy Hòa','Đông Hòa','Đồng Xuân','Phú Hòa','Sông Cầu','Sông Hinh','Tây Hòa','Tuy An'],
    'Quảng Bình': ['Đồng Hới','Ba Đồn','Bố Trạch','Lệ Thủy','Minh Hóa','Quảng Ninh','Quảng Trạch','Tuyên Hóa'],
    'Quảng Nam': ['Tam Kỳ','Hội An','Điện Bàn','Duy Xuyên','Đại Lộc','Hiệp Đức','Nam Giang','Nam Trà My','Nông Sơn','Núi Thành','Phú Ninh','Phước Sơn','Quế Sơn','Tây Giang','Thăng Bình','Tiên Phước'],
    'Quảng Ngãi': ['Quảng Ngãi','Đức Phổ','Ba Tơ','Bình Sơn','Lý Sơn','Minh Long','Mộ Đức','Nghĩa Hành','Sơn Hà','Sơn Tây','Sơn Tinh','Trà Bồng','Tư Nghĩa'],
    'Quảng Ninh': ['Hạ Long','Cẩm Phả','Uông Bí','Móng Cái','Cô Tô','Đầm Hà','Hải Hà','Hoành Bồ','Tiên Yên','Vân Đồn','Ba Chẽ','Bình Liêu','Đông Triều','Quảng Yên'],
    'Quảng Trị': ['Đông Hà','Quảng Trị','Cam Lộ','Cồn Cỏ','Đakrông','Gio Linh','Hải Lăng','Hướng Hóa','Triệu Phong','Vĩnh Linh'],
    'Sóc Trăng': ['Sóc Trăng','Châu Thành','Cù Lao Dung','Kế Sách','Long Phú','Mỹ Tú','Mỹ Xuyên','Ngã Năm','Thạnh Trị','Trần Đề','Vĩnh Châu'],
    'Sơn La': ['Sơn La','Bắc Yên','Mai Sơn','Mộc Châu','Mường La','Phù Yên','Quỳnh Nhai','Sốp Cộp','Thuận Châu','Vân Hồ','Yên Châu'],
    'Tây Ninh': ['Tây Ninh','Bến Cầu','Châu Thành','Dương Minh Châu','Gò Dầu','Hòa Thành','Tân Biên','Tân Châu','Trảng Bàng'],
    'Thái Bình': ['Thái Bình','Đông Hưng','Hưng Hà','Kiến Xương','Quỳnh Phụ','Thái Thụy','Tiền Hải','Vũ Thư'],
    'Thái Nguyên': ['Thái Nguyên','Sông Công','Phổ Yên','Đại Từ','Định Hóa','Đồng Hỷ','Phú Bình','Phú Lương','Võ Nhai'],
    'Thanh Hóa': ['Thanh Hóa','Bỉm Sơn','Sầm Sơn','Bá Thước','Cẩm Thủy','Đông Sơn','Hà Trung','Hậu Lộc','Hoằng Hóa','Lang Chánh','Mường Lát','Nga Sơn','Ngọc Lặc','Như Thanh','Như Xuân','Nông Cống','Quan Hóa','Quan Sơn','Quảng Xương','Thạch Thành','Thiệu Hóa','Thọ Xuân','Thường Xuân','Tĩnh Gia','Triệu Sơn','Vĩnh Lộc','Yên Định'],
    'Thừa Thiên - Huế': ['Huế','Hương Thủy','Hương Trà','A Lưới','Nam Đông','Phong Điền','Phú Lộc','Phú Vang','Quảng Điền'],
    'Tiền Giang': ['Mỹ Tho','Gò Công','Cai Lậy','Cái Bè','Châu Thành','Chợ Gạo','Gò Công Đông','Gò Công Tây','Tân Phú Đông','Tân Phước'],
    'Trà Vinh': ['Trà Vinh','Duyên Hải','Cầu Kè','Cầu Ngang','Châu Thành','Tiểu Cần','Trà Cú'],
    'Tuyên Quang': ['Tuyên Quang','Chiêm Hóa','Hàm Yên','Lâm Bình','Na Hang','Sơn Dương','Yên Sơn'],
    'Vĩnh Long': ['Vĩnh Long','Bình Minh','Bình Tân','Long Hồ','Mang Thít','Tam Bình','Trà Ôn','Vũng Liêm'],
    'Vĩnh Phúc': ['Vĩnh Yên','Phúc Yên','Bình Xuyên','Lập Thạch','Sông Lô','Tam Dương','Tam Đảo','Vĩnh Tường','Yên Lạc'],
    'Yên Bái': ['Yên Bái','Nghĩa Lộ','Lục Yên','Mù Cang Chải','Trạm Tấu','Trấn Yên','Văn Chấn','Văn Yên','Yên Bình']
  };

  /* Public API */
  window._ADDR_DATA = _ADDR_DATA;

  /* Tạo HTML select Tỉnh/TP */
  window._addrProvinceSelect = function(id, curVal, onchangeCb) {
    var opts = '<option value="">-- Chọn tỉnh/thành phố --</option>';
    Object.keys(_ADDR_DATA).sort().forEach(function(p) {
      opts += '<option value="'+_esc(p)+'"'+(curVal===p?' selected':'')+'>'+_esc(p)+'</option>';
    });
    return '<select id="'+id+'" class="form-input" data-cb="'+_esc(onchangeCb)+'">'+opts+'</select>';
  };

  /* Tạo HTML select Quận/Huyện theo tỉnh */
  window._addrDistrictSelect = function(id, province, curVal) {
    var districts = _ADDR_DATA[province] || [];
    if (!districts.length) return '<select id="'+id+'" class="form-input"><option value="">-- Chọn tỉnh trước --</option></select>';
    var opts = '<option value="">-- Chọn quận/huyện --</option>';
    districts.forEach(function(d) {
      opts += '<option value="'+_esc(d)+'"'+(curVal===d?' selected':'')+'>'+_esc(d)+'</option>';
    });
    return '<select id="'+id+'" class="form-input">'+opts+'</select>';
  };

  /* Update district dropdown khi chọn tỉnh */
  window._addrOnProvinceChange = function(provinceSelId, districtSelId) {
    var pSel = document.getElementById(provinceSelId);
    var dSel = document.getElementById(districtSelId);
    if (!pSel || !dSel) return;
    var province = pSel.value;
    var districts = _ADDR_DATA[province] || [];
    dSel.innerHTML = '<option value="">-- Chọn quận/huyện --</option>'
      + districts.map(function(d){ return '<option value="'+_esc(d)+'">'+_esc(d)+'</option>'; }).join('');
  };

  /* Format địa chỉ từ tỉnh + quận + số nhà */
  /* Bind province change event sau khi render */
  window._addrBindProvince = function(id) {
    var sel = document.getElementById(id);
    if (!sel || sel._addrBound) return;
    sel._addrBound = true;
    sel.addEventListener('change', function() {
      var cb = sel.getAttribute('data-cb');
      if (cb) { try { new Function(cb)(); } catch(ex) {} }
    });
  };

  window._addrFormat = function(house, district, province) {
    var parts = [house, district, province].filter(function(s){ return s && s.trim(); });
    return parts.join(', ');
  };

  function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

})();
