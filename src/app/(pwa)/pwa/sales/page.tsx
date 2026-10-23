import { Alert } from "antd";
import PwaShell from "@/components/pwa/PwaShell";
export default function Page(){return <PwaShell title="Kinh doanh" subtitle="Phạm vi dữ liệu đang được siết an toàn"><Alert type="info" showIcon message="Dữ liệu khách hàng và đơn bán tạm thời chưa hiển thị" description="T-DATA sẽ bổ sung gán khách hàng/đơn cho nhân viên kinh doanh. Khi đó ứng dụng sẽ chỉ hiển thị dữ liệu được phân công." /></PwaShell>}
