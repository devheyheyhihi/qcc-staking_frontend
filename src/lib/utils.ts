import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function unscientificNotation(x: any): string {
  x = x.toString();
  if (!x.toString().includes("e")) {
    return x;
  }
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.split("e-")[1]);
    if (e) {
      x = x.split("e-")[0].replace(".", "");
      console.log(x);
      x = "0." + new Array(e).join("0") + x;
    }
  } else {
    var e = parseInt(x.split("+")[1]);
    x = x.split("e")[0].replace(".", "");
    const xLength = x.length;
    x += new Array(e - xLength + 2).join("0");
  }
  return x;
}

export function formatAmount(
  amount: string | number,
  decimalPlaces = 8,
): string {
  const regex = new RegExp(`^-?\\d+(?:\\.\\d{0,${decimalPlaces}})?`);
  return Number(regex.exec(amount.toString())).toString();
}