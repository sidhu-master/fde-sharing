import useCustomerStore from "@/stores/useDataStore";

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-zinc-500 w-40">{label}</span>
      <span className={`text-sm ${className}`}>{value}</span>
    </div>
  );
}

export default function CustomerDetails() {
  const { customerDetails } = useCustomerStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <DetailItem label="姓名" value={customerDetails.name} />
        <DetailItem
          label="客户编号"
          value={customerDetails.id}
          className="font-mono text-xs"
        />
        <DetailItem
          label="订单数量"
          value={customerDetails.orderNb.toString()}
        />
        <DetailItem
          label="注册日期"
          value={customerDetails.signupDate.toString()}
        />
      </div>
    </div>
  );
}
