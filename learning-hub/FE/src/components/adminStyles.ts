/** Class dùng chung cho Admin Portal. Viền 1px xám dịu, chữ tương phản cao ở cả hai giao diện. */
export const hairline = 'border-neutral-200 dark:border-neutral-800';

/**
 * Ô nhập: nền và chữ đặt rõ cho từng giao diện (không dùng nền trong suốt) nên không bao giờ trùng màu tối
 * ở Dark Mode. Viền sáng hơn nền, focus có vòng chỉ màu.
 */
export const control =
  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 outline-none ' +
  'placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ' +
  'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500';

/**
 * Dropdown: ngoài ô chọn còn phải đặt màu cho từng <option> và `color-scheme: dark`, vì danh sách mở ra do
 * trình duyệt vẽ và mặc định lấy chữ sáng trên nền trắng (không đọc được) khi trang ở Dark Mode.
 */
export const selectControl =
  `${control} cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 dark:hover:bg-neutral-800 ` +
  'dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-neutral-900 ' +
  'dark:[&>option]:bg-neutral-800 dark:[&>option]:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60';
