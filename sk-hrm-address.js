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
    'H\u00e0 N\u1ed9i': [
      'Ba \u0110\u00ecnh','Ho\u00e0n Ki\u1ebfm','T\u00e2y H\u1ed3','Long Bi\u00ean','C\u1ea7u Gi\u1ea5y',
      '\u0110\u1ed1ng \u0110a','Hai B\u00e0 Tr\u01b0ng','Ho\u00e0ng Mai','Thanh Xu\u00e2n',
      'Nam T\u1eeb Li\u00eam','B\u1eafc T\u1eeb Li\u00eam','H\u00e0 \u0110\u00f4ng',
      'S\u01a1n T\u00e2y','Ba V\u00ec','Ph\u00fac Th\u1ecd','\u0110an Ph\u01b0\u1ee3ng',
      'Ho\u00e0i \u0110\u1ee9c','Qu\u1ed1c Oai','Th\u1ea1ch Th\u1ea5t','Ch\u01b0\u01a1ng M\u1ef9',
      'Thanh Oai','Th\u01b0\u1eddng T\u00edn','Ph\u00fa Xuy\u00ean','\u1ee4ng H\u00f2a',
      'M\u1ef9 \u0110\u1ee9c','M\u00ea Linh','S\u00f3c S\u01a1n','\u0110\u00f4ng Anh',
      'Gia L\u00e2m'
    ],
    'TP. H\u1ed3 Ch\u00ed Minh': [
      'Qu\u1eadn 1','Qu\u1eadn 3','Qu\u1eadn 4','Qu\u1eadn 5','Qu\u1eadn 6',
      'Qu\u1eadn 7','Qu\u1eadn 8','Qu\u1eadn 10','Qu\u1eadn 11','Qu\u1eadn 12',
      'B\u00ecnh Th\u1ea1nh','G\u00f2 V\u1ea5p','Ph\u00fa Nhu\u1eadn','T\u00e2n B\u00ecnh',
      'T\u00e2n Ph\u00fa','\u00d0 T\u00e2n S\u01a1n Nh\u1ea5t','B\u00ecnh T\u00e2n',
      'Th\u1ee7 \u0110\u1ee9c','H\u00f3c M\u00f4n','Nh\u00e0 B\u00e8','C\u1ea7n Gi\u1edd',
      'C\u1ee7 Chi','B\u00ecnh Ch\u00e1nh'
    ],
    '\u0110\u00e0 N\u1eb5ng': [
      'H\u1ea3i Ch\u00e2u','Thanh Kh\u00ea','S\u01a1n Tr\u00e0','Ng\u0169 H\u00e0nh S\u01a1n',
      'Li\u00ean Chi\u1ec3u','C\u1ea9m L\u1ec7','H\u00f2a Vang','Ho\u00e0ng Sa'
    ],
    'H\u1ea3i Ph\u00f2ng': [
      'H\u1ed3ng B\u00e0ng','L\u00ea Ch\u00e2n','Ng\u00f4 Quy\u1ec1n','Ki\u1ebfn An',
      'H\u1ea3i An','\u0110\u1ed3 S\u01a1n','D\u01b0\u01a1ng Kinh','Thu\u1ef7 Nguy\u00ean',
      'An D\u01b0\u01a1ng','An L\u00e3o','Ki\u1ebfn Thu\u1ef5','Ti\u00ean L\u00e3ng',
      'V\u0129nh B\u1ea3o','C\u00e1t H\u1ea3i','B\u1ea1ch Long V\u0129'
    ],
    'C\u1ea7n Th\u01a1': [
      'Ninh Ki\u1ec1u','B\u00ecnh Th\u1ee7y','C\u00e1i R\u0103ng','\u00d4 M\u00f4n',
      'Th\u1ed1t N\u1ed1t','Vinhlong', 'Phong \u0110i\u1ec1n','C\u1edd \u0110\u1ecf',
      'Th\u1edbi Lai'
    ],
    'An Giang': ['Long Xuy\u00ean','Ch\u00e2u \u0110\u1ed1c','An Ph\u00fa','T\u00e2n Ch\u00e2u','Ph\u00fa T\u00e2n','Ch\u00e2u Ph\u00fa','Tho\u1ea1i S\u01a1n','Ch\u00e2u Th\u00e0nh','Tho\u1ea1i S\u01a1n'],
    'B\u00e0 R\u1ecba \u2013 V\u0169ng T\u00e0u': ['V\u0169ng T\u00e0u','B\u00e0 R\u1ecba','Xu\u00e2n L\u1ed9c','Long \u0110\u1ea5t','Th\u00e0nh ph\u1ed1 \u0110\u00e1 B\u1ea1c','X\u0169 Long H\u01b0\u01a1ng'],
    'B\u1eafc Giang': ['B\u1eafc Giang','S\u01a1n \u0110\u1ed9ng','L\u1ea1ng Giang','L\u1ee5c Ng\u1ea1n','L\u1ee5c Nam','Y\u00ean Th\u1ebf','Hi\u1ec7p H\u00f2a','T\u00e2n Y\u00ean','Vi\u1ec7t Y\u00ean','Y\u00ean D\u0169ng'],
    'B\u1eafc K\u1ea1n': ['B\u1eafc K\u1ea1n','Ba B\u1ec3','B\u1ea1ch Th\u00f4ng','Ch\u1ee3 \u0110\u1ed3n','Ch\u1ee3 M\u1edbi','Na R\u00ec','Ng\u00e2n S\u01a1n','P\u00e1c N\u1eb7m'],
    'B\u1ea1c Li\u00eau': ['B\u1ea1c Li\u00eau','Ph\u01b0\u1edbc Long','H\u1ed3ng D\u00e2n','Gi\u00e1 Rai','V\u0129nh L\u1ee3i','H\u00f2a B\u00ecnh','\u0110\u00f4ng H\u1ea3i'],
    'B\u1eafc Ninh': ['B\u1eafc Ninh','T\u1eeb S\u01a1n','Y\u00ean Phong','Ti\u00ean Du','Qu\u1ebf V\u00f5','Gia B\u00ecnh','Thu\u1eadn Th\u00e0nh','L\u01b0\u01a1ng T\u00e0i'],
    'B\u1ebfn Tre': ['B\u1ebfn Tre','Ch\u00e2u Th\u00e0nh','Gi\u1ed3ng Tr\u00f4m','M\u1ecf C\u00e0y Nam','M\u1ecf C\u00e0y B\u1eafc','Th\u1ea1nh Ph\u00fa','Ba Tri','B\u00ecnh \u0110\u1ea1i','Ch\u1ee3 L\u00e1ch'],
    'B\u00ecnh D\u01b0\u01a1ng': ['Th\u1ee7 D\u1ea7u M\u1ed9t','D\u0129 An','Thu\u1eadn An','T\u00e2n Uy\u00ean','B\u1ebfn C\u00e1t','Ph\u00fa Gi\u00e1o','B\u1eafc T\u00e2n Uy\u00ean','D\u1ea7u Ti\u1ebfng'],
    'B\u00ecnh \u0110\u1ecbnh': ['Quy Nh\u01a1n','An Nh\u01a1n','Ho\u00e0i Nh\u01a1n','T\u00e2y S\u01a1n','Ph\u00f9 C\u00e1t','Ph\u00f9 M\u1ef9','Vĩnh Thạnh','An Lão','Hoài Ân','Vân Canh'],
    'B\u00ecnh Ph\u01b0\u1edbc': ['Đồng Xoài','Bình Long','Phước Long','Chơn Thành','Đồng Phú','Bù Đăng','Bù Gia Mập','Hớn Quản','Lộc Ninh'],
    'B\u00ecnh Thu\u1eadn': ['Phan Thiết','La Gi','Tuy Phong','Bắc Bình','Hàm Thuận Bắc','Hàm Thuận Nam','Hàm Tân','Tánh Linh','Đức Linh','Phú Quý'],
    'C\u00e0 Mau': ['Cà Mau','Thới Bình','U Minh','Trần Văn Thời','Cái Nước','Đầm Dơi','Năm Căn','Ngọc Hiển','Phú Tân'],
    'Cao B\u1eb1ng': ['Cao Bằng','Bảo Lạc','Bảo Lâm','Hạ Lang','Hà Quảng','Hòa An','Nguyên Bình','Phục Hòa','Quảng Hòa','Thạch An','Trùng Khánh'],
    '\u0110\u1eafc L\u1eafc': ['Buôn Ma Thuột','Buôn Hồ','Ea H\'leo','Ea Súp','Krông Ana','Krông Bông','Krông Búk','Krông Năng','Krông Pắc','Lắk','M\'Đrắk','Cư Kuin','Cư M\'gar'],
    '\u0110\u1eafc N\u00f4ng': ['Gia Nghĩa','Cư Jút','Đắk Glong','Đắk Mil','Đắk R\'Lấp','Đắk Song','Krông Nô','Tuy Đức'],
    '\u0110i\u1ec7n Bi\u00ean': ['Điện Biên Phủ','Mường Lay','Điện Biên','Điện Biên Đông','Mường Ảng','Mường Chà','Mường Nhé','Nậm Pồ','Tủa Chùa','Tuần Giáo'],
    '\u0110\u1ed3ng Nai': ['Biên Hòa','Long Khánh','Cẩm Mỹ','Định Quán','Long Thành','Nhơn Trạch','Tân Phú','Thống Nhất','Trảng Bom','Vĩnh Cửu','Xuân Lộc'],
    '\u0110\u1ed3ng Th\u00e1p': ['Cao Lãnh','Sa Đéc','Hồng Ngự','Châu Thành','Hồng Ngự','Lai Vung','Lấp Vò','Tam Nông','Tân Hồng','Tháp Mười','Tân Châu'],
    'Gia Lai': ['Pleiku','An Khê','Ayun Pa','Chư Păh','Chư Prông','Chư Sê','Đắk Đoa','Đắk Pơ','Đức Cơ','Ia Grai','Ia Pa','KBang','Kông Chro','Krông Pa','Mang Yang','Phú Thiện'],
    'H\u00e0 Giang': ['Hà Giang','Bắc Mê','Bắc Quang','Đồng Văn','Hoàng Su Phì','Mèo Vạc','Quản Bạ','Quang Bình','Vị Xuyên','Xín Mần','Yên Minh'],
    'H\u00e0 Nam': ['Phủ Lý','Bình Lục','Duy Tiên','Kim Bảng','Lý Nhân','Thanh Liêm'],
    'H\u00e0 T\u0129nh': ['Hà Tĩnh','Hồng Lĩnh','Cẩm Xuyên','Can Lộc','Đức Thọ','Hương Khê','Hương Sơn','Kỳ Anh','Lộc Hà','Nghi Xuân','Thạch Hà','Vũ Quang'],
    'H\u1eadu Giang': ['Vị Thanh','Ngã Bảy','Châu Thành','Châu Thành A','Long Mỹ','Phụng Hiệp','Vị Thủy'],
    'H\u00f2a B\u00ecnh': ['Hòa Bình','Cao Phong','Đà Bắc','Kim Bôi','Kỳ Sơn','Lạc Sơn','Lạc Thủy','Lương Sơn','Mai Châu','Tân Lạc','Yên Thủy'],
    'H\u01b0ng Y\u00ean': ['Hưng Yên','Mỹ Hào','Ân Thi','Khoái Châu','Kim Động','Phù Cừ','Tiên Lữ','Văn Giang','Văn Lâm','Yên Mỹ'],
    'Kh\u00e1nh H\u00f2a': ['Nha Trang','Cam Ranh','Ninh Hòa','Diên Khánh','Khánh Sơn','Khánh Vĩnh','Trường Sa','Vạn Ninh'],
    'Ki\u00ean Giang': ['Rạch Giá','Hà Tiên','An Biên','An Minh','Châu Thành','Giang Thành','Giồng Riềng','Gò Quao','Hòn Đất','Kiên Hải','Kiên Lương','Phú Quốc','Tân Hiệp','U Minh Thượng','Vĩnh Thuận'],
    'Kon Tum': ['Kon Tum','Đắk Glei','Đắk Hà','Đắk Tô','Ia H\'Drai','Kon Plông','Kon Rẫy','Ngọc Hồi','Sa Thầy','Tu Mơ Rông'],
    'Lai Ch\u00e2u': ['Lai Châu','Mường Tè','Nậm Nhùn','Phong Thổ','Sìn Hồ','Tam Đường','Tân Uyên','Than Uyên'],
    'L\u00e2m \u0110\u1ed3ng': ['Đà Lạt','Bảo Lộc','Bảo Lâm','Cát Tiên','Đam Rông','Di Linh','Đơn Dương','Đức Trọng','Lạc Dương','Lâm Hà'],
    'L\u1ea1ng S\u01a1n': ['Lạng Sơn','Bắc Sơn','Bình Gia','Cao Lộc','Chi Lăng','Đình Lập','Hữu Lũng','Lộc Bình','Tràng Định','Văn Lãng','Văn Quan'],
    'L\u00e0o Cai': ['Lào Cai','Bắc Hà','Bảo Thắng','Bảo Yên','Bát Xát','Mường Khương','Sa Pa','Si Ma Cai','Văn Bàn'],
    'Long An': ['Tân An','Kiến Tường','Bến Lức','Cần Đước','Cần Giuộc','Châu Thành','Đức Hòa','Đức Huệ','Mộc Hóa','Tân Hưng','Tân Thạnh','Tân Trụ','Thạnh Hóa','Thủ Thừa','Vĩnh Hưng'],
    'Nam \u0110\u1ecbnh': ['Nam Định','Giao Thủy','Hải Hậu','Mỹ Lộc','Nam Trực','Nghĩa Hưng','Trực Ninh','Vụ Bản','Xuân Trường','Ý Yên'],
    'Ngh\u1ec7 An': ['Vinh','Cửa Lò','Hoàng Mai','Thái Hòa','Anh Sơn','Con Cuông','Diễn Châu','Đô Lương','Hưng Nguyên','Kỳ Sơn','Nam Đàn','Nghi Lộc','Nghĩa Đàn','Quế Phong','Quỳ Châu','Quỳ Hợp','Quỳnh Lưu','Tân Kỳ','Thanh Chương','Tương Dương','Yên Thành'],
    'Ninh B\u00ecnh': ['Ninh Bình','Tam Điệp','Gia Viễn','Hoa Lư','Kim Sơn','Nho Quan','Yên Khánh','Yên Mô'],
    'Ninh Thu\u1eadn': ['Phan Rang – Tháp Chàm','Bác Ái','Ninh Hải','Ninh Phước','Ninh Sơn','Thuận Bắc','Thuận Nam'],
    'Ph\u00fa Th\u1ecd': ['Việt Trì','Phú Thọ','Cẩm Khê','Đoan Hùng','Hạ Hòa','Lâm Thao','Phù Ninh','Tam Nông','Tân Sơn','Thanh Ba','Thanh Sơn','Thanh Thủy','Yên Lập'],
    'Ph\u00fa Y\u00ean': ['Tuy Hòa','Đông Hòa','Đồng Xuân','Phú Hòa','Sông Cầu','Sông Hinh','Tây Hòa','Tuy An'],
    'Qu\u1ea3ng B\u00ecnh': ['Đồng Hới','Ba Đồn','Bố Trạch','Lệ Thủy','Minh Hóa','Quảng Ninh','Quảng Trạch','Tuyên Hóa'],
    'Qu\u1ea3ng Nam': ['Tam Kỳ','Hội An','Điện Bàn','Duy Xuyên','Đại Lộc','Hiệp Đức','Nam Giang','Nam Trà My','Nông Sơn','Núi Thành','Phú Ninh','Phước Sơn','Quế Sơn','Tây Giang','Thăng Bình','Tiên Phước'],
    'Qu\u1ea3ng Ng\u00e3i': ['Quảng Ngãi','Đức Phổ','Ba Tơ','Bình Sơn','Lý Sơn','Minh Long','Mộ Đức','Nghĩa Hành','Sơn Hà','Sơn Tây','Sơn Tinh','Trà Bồng','Tư Nghĩa'],
    'Qu\u1ea3ng Ninh': ['Hạ Long','Cẩm Phả','Uông Bí','Móng Cái','Cô Tô','Đầm Hà','Hải Hà','Hoành Bồ','Tiên Yên','Vân Đồn','Ba Chẽ','Bình Liêu','Đông Triều','Quảng Yên'],
    'Qu\u1ea3ng Tr\u1ecb': ['Đông Hà','Quảng Trị','Cam Lộ','Cồn Cỏ','Đakrông','Gio Linh','Hải Lăng','Hướng Hóa','Triệu Phong','Vĩnh Linh'],
    'S\u00f3c Tr\u0103ng': ['Sóc Trăng','Châu Thành','Cù Lao Dung','Kế Sách','Long Phú','Mỹ Tú','Mỹ Xuyên','Ngã Năm','Thạnh Trị','Trần Đề','Vĩnh Châu'],
    'S\u01a1n La': ['Sơn La','Bắc Yên','Mai Sơn','Mộc Châu','Mường La','Phù Yên','Quỳnh Nhai','Sốp Cộp','Thuận Châu','Vân Hồ','Yên Châu'],
    'T\u00e2y Ninh': ['Tây Ninh','Bến Cầu','Châu Thành','Dương Minh Châu','Gò Dầu','Hòa Thành','Tân Biên','Tân Châu','Trảng Bàng'],
    'Th\u00e1i B\u00ecnh': ['Thái Bình','Đông Hưng','Hưng Hà','Kiến Xương','Quỳnh Phụ','Thái Thụy','Tiền Hải','Vũ Thư'],
    'Th\u00e1i Nguy\u00ean': ['Thái Nguyên','Sông Công','Phổ Yên','Đại Từ','Định Hóa','Đồng Hỷ','Phú Bình','Phú Lương','Võ Nhai'],
    'Thanh H\u00f3a': ['Thanh Hóa','Bỉm Sơn','Sầm Sơn','Bá Thước','Cẩm Thủy','Đông Sơn','Hà Trung','Hậu Lộc','Hoằng Hóa','Lang Chánh','Mường Lát','Nga Sơn','Ngọc Lặc','Như Thanh','Như Xuân','Nông Cống','Quan Hóa','Quan Sơn','Quảng Xương','Thạch Thành','Thiệu Hóa','Thọ Xuân','Thường Xuân','Tĩnh Gia','Triệu Sơn','Vĩnh Lộc','Yên Định'],
    'Th\u1eeba Thi\u00ean - Hu\u1ebf': ['Huế','Hương Thủy','Hương Trà','A Lưới','Nam Đông','Phong Điền','Phú Lộc','Phú Vang','Quảng Điền'],
    'Ti\u1ec1n Giang': ['Mỹ Tho','Gò Công','Cai Lậy','Cái Bè','Châu Thành','Chợ Gạo','Gò Công Đông','Gò Công Tây','Tân Phú Đông','Tân Phước'],
    'Tr\u00e0 Vinh': ['Trà Vinh','Duyên Hải','Cầu Kè','Cầu Ngang','Châu Thành','Tiểu Cần','Trà Cú'],
    'Tuy\u00ean Quang': ['Tuyên Quang','Chiêm Hóa','Hàm Yên','Lâm Bình','Na Hang','Sơn Dương','Yên Sơn'],
    'V\u0129nh Long': ['Vĩnh Long','Bình Minh','Bình Tân','Long Hồ','Mang Thít','Tam Bình','Trà Ôn','Vũng Liêm'],
    'V\u0129nh Ph\u00fac': ['Vĩnh Yên','Phúc Yên','Bình Xuyên','Lập Thạch','Sông Lô','Tam Dương','Tam Đảo','Vĩnh Tường','Yên Lạc'],
    'Y\u00ean B\u00e1i': ['Yên Bái','Nghĩa Lộ','Lục Yên','Mù Cang Chải','Trạm Tấu','Trấn Yên','Văn Chấn','Văn Yên','Yên Bình']
  };

  /* Public API */
  window._ADDR_DATA = _ADDR_DATA;

  /* Tạo HTML select Tỉnh/TP */
  window._addrProvinceSelect = function(id, curVal, onchangeCb) {
    var opts = '<option value="">-- Ch\u1ecdn t\u1ec9nh/th\u00e0nh ph\u1ed1 --</option>';
    Object.keys(_ADDR_DATA).sort().forEach(function(p) {
      opts += '<option value="'+_esc(p)+'"'+(curVal===p?' selected':'')+'>'+_esc(p)+'</option>';
    });
    return '<select id="'+id+'" class="form-input" data-cb="'+_esc(onchangeCb)+'">'+opts+'</select>';
  };

  /* Tạo HTML select Quận/Huyện theo tỉnh */
  window._addrDistrictSelect = function(id, province, curVal) {
    var districts = _ADDR_DATA[province] || [];
    if (!districts.length) return '<select id="'+id+'" class="form-input"><option value="">-- Ch\u1ecdn t\u1ec9nh tr\u01b0\u1edbc --</option></select>';
    var opts = '<option value="">-- Ch\u1ecdn qu\u1eadn/huy\u1ec7n --</option>';
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
    dSel.innerHTML = '<option value="">-- Ch\u1ecdn qu\u1eadn/huy\u1ec7n --</option>'
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
