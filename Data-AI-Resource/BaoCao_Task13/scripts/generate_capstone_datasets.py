import os
import random
import datetime
import pandas as pd
import numpy as np

random.seed(42)
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_DIR = os.path.join(
    BASE_DIR,
    "projects",
    "DA-02_inventory_operations",
    "student_edition",
    "data",
    "clean",
)
DIRTY_DIR = os.path.join(
    BASE_DIR,
    "projects",
    "DA-02_inventory_operations",
    "student_edition",
    "data",
    "dirty",
)
os.makedirs(CLEAN_DIR, exist_ok=True)
os.makedirs(DIRTY_DIR, exist_ok=True)

# 1. WAREHOUSES
warehouses = [
    {
        "warehouse_id": "WH-HN01",
        "warehouse_name": "Kho Trung Tam Ha Noi",
        "region": "North",
        "capacity_sqm": 5000,
        "manager_name": "Nguyen Van Binh",
        "status": "ACTIVE",
    },
    {
        "warehouse_id": "WH-DN01",
        "warehouse_name": "Kho Mien Trung Da Nang",
        "region": "Central",
        "capacity_sqm": 2500,
        "manager_name": "Le Thi Mai",
        "status": "ACTIVE",
    },
    {
        "warehouse_id": "WH-HCM01",
        "warehouse_name": "Kho Tong TP. Ho Chi Minh",
        "region": "South",
        "capacity_sqm": 8000,
        "manager_name": "Tran Huu Duc",
        "status": "ACTIVE",
    },
]
df_warehouses = pd.DataFrame(warehouses)

# 2. PRODUCTS (50 SKUs across 5 categories)
categories = [
    (
        "CAT-ELEC",
        "Electronics",
        [
            "CyberKey Pro Mechanical Keyboard",
            "CyberScreen 15.6 Portable Monitor",
            "CyberHub USB-C 10-in-1",
            "PowerCore 20000mAh PD",
            "CyberCharger 65W GaN",
            "SmartPlug Mini IoT",
            "CyberDock Dual 4K",
            "Stylus Pen Active",
            "ErgoPad Wireless Charger",
            "CyberBar LED Desk Lamp",
        ],
    ),
    (
        "CAT-OFF",
        "Office Equipment",
        [
            "ErgoChair Pro Mesh",
            "StandingDesk Smart Motor",
            "CyberMonitor Arm Dual",
            "FootRest Ergonomic Foam",
            "DeskOrganizer Aluminum",
            "CableTray UnderDesk",
            "DocumentScanner HD",
            "LabelPrinter Thermal",
            "Whiteboard Glass Magnetic",
            "AntiFatigue Standing Mat",
        ],
    ),
    (
        "CAT-KIT",
        "Hardware Kits",
        [
            "IoT Starter Kit ESP32",
            "CyberBot AI Robotic Arm",
            "SensorKit 37-in-1 Arduino",
            "Raspberry Pi 5 Developer Kit",
            "FPGA Learning Board",
            "Soldering Station Digital",
            "Multimeter AutoRanging",
            "Oscilloscope Mini Handheld",
            "Breadboard Wire Pack 500pcs",
            "AI Camera EdgeKit",
        ],
    ),
    (
        "CAT-PERI",
        "Peripherals",
        [
            "ErgoMouse Wireless Vertical",
            "Trackball Precision Mouse",
            "Webcam 4K AI AutoFocus",
            "ConferenceSpeaker Mic 360",
            "USB-C to DP 2.1 Braided Cable",
            "Cat7 Ethernet Patch 10m",
            "Keycap Set PBT Dye-Sub",
            "WristRest Memory Foam",
            "CardReader USB 3.2 HighSpeed",
            "Bluetooth 5.3 Audio Adapter",
        ],
    ),
    (
        "CAT-AUDIO",
        "Audio Devices",
        [
            "CyberSound ANC Headphone",
            "StudioMic Condenser USB",
            "Wireless Earbuds Gaming LowLatency",
            "SoundBar Compact Desktop",
            "AudioInterface 2x2 XLR",
            "BoomArm Mic Stand HeavyDuty",
            "PopFilter DoubleMesh",
            "HeadphoneStand RGB Aluminum",
            "AudioMixer 4-Channel",
            "Lavalier Wireless Mic Dual",
        ],
    ),
]

products = []
prod_idx = 1
for cat_id, cat_name, items in categories:
    for item_name in items:
        p_id = f"PROD-{prod_idx:03d}"
        sku = f"SKU-{cat_id[4:]}-{prod_idx:03d}"
        base_cost = round(random.uniform(18.0, 160.0), 2)
        base_price = round(base_cost * random.uniform(1.40, 1.80), 2)
        lead_time = random.choice([4, 6, 8, 12])
        min_safety = random.randint(25, 55)
        rop = int(min_safety + (lead_time * random.uniform(6.0, 12.0)))
        products.append(
            {
                "product_id": p_id,
                "sku": sku,
                "product_name": item_name,
                "category": cat_name,
                "category_id": cat_id,
                "unit_cost": base_cost,
                "unit_price": base_price,
                "lead_time_days": lead_time,
                "min_safety_stock": min_safety,
                "reorder_point": rop,
            }
        )
        prod_idx += 1

df_products = pd.DataFrame(products)

# 3. PURCHASE ORDERS
vendors = [
    "CyberTech Supply Co.",
    "VinaHardware Global",
    "DongA Electronics Ltd",
    "Mekong Trading & Logistics",
    "Pacific Component Corp",
]
purchase_orders = []
start_date = datetime.date(2024, 1, 1)

for po_num in range(1, 90):
    p_id = f"PO-2024-{po_num:03d}"
    v_name = random.choice(vendors)
    o_date = start_date + datetime.timedelta(days=random.randint(0, 345))
    lead = random.choice([5, 7, 10, 14])
    exp_date = o_date + datetime.timedelta(days=lead)

    is_completed = random.random() < 0.94
    if is_completed:
        delay = random.choice([0, 0, 1, 2, -1, 3])
        act_date = exp_date + datetime.timedelta(days=delay)
        status = "COMPLETED"
    else:
        act_date = None
        status = "PENDING"

    purchase_orders.append(
        {
            "po_id": p_id,
            "vendor_name": v_name,
            "order_date": o_date.strftime("%Y-%m-%d"),
            "expected_delivery_date": exp_date.strftime("%Y-%m-%d"),
            "actual_delivery_date": act_date.strftime("%Y-%m-%d") if act_date else None,
            "status": status,
            "total_amount": round(random.uniform(6000.0, 22000.0), 2),
        }
    )

df_purchase_orders = pd.DataFrame(purchase_orders)

# 4. INVENTORY MOVEMENTS
movements = []
mov_id = 1

# A. Beginning Inventory on 2024-01-01
for w in warehouses:
    for p in products:
        qty = random.randint(25, 45)
        movements.append(
            {
                "movement_id": f"MOV-{mov_id:05d}",
                "timestamp": "2024-01-01 08:00:00",
                "warehouse_id": w["warehouse_id"],
                "product_id": p["product_id"],
                "movement_type": "INBOUND_PO",
                "direction": "IN",
                "quantity": qty,
                "unit_cost": p["unit_cost"],
                "reference_doc": "INIT-BALANCE-2024",
                "notes": "So du dau ky nam 2024",
            }
        )
        mov_id += 1

current_stock = {
    (w["warehouse_id"], p["product_id"]): next(
        m["quantity"]
        for m in movements
        if m["warehouse_id"] == w["warehouse_id"] and m["product_id"] == p["product_id"]
    )
    for w in warehouses
    for p in products
}

current_time = datetime.datetime(2024, 1, 2, 8, 30, 0)
end_time = datetime.datetime(2024, 12, 31, 18, 0, 0)
completed_pos = [po for po in purchase_orders if po["status"] == "COMPLETED"]

while current_time < end_time:
    step_hours = random.choice([3, 4, 5, 6])
    current_time += datetime.timedelta(hours=step_hours)
    if current_time >= end_time:
        break

    event_type = random.choices(
        [
            "OUTBOUND_SALE",
            "INBOUND_PO",
            "TRANSFER",
            "RETURN_CUSTOMER",
            "RETURN_VENDOR",
            "SCRAP_DAMAGED",
        ],
        weights=[0.68, 0.17, 0.08, 0.03, 0.02, 0.02],
    )[0]

    w = random.choice(warehouses)["warehouse_id"]
    p = random.choice(products)
    p_id = p["product_id"]
    curr_qty = current_stock[(w, p_id)]

    if event_type == "OUTBOUND_SALE":
        if curr_qty > 0:
            sold_qty = min(curr_qty, random.randint(3, 14))
            current_stock[(w, p_id)] -= sold_qty
            movements.append(
                {
                    "movement_id": f"MOV-{mov_id:05d}",
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "warehouse_id": w,
                    "product_id": p_id,
                    "movement_type": "OUTBOUND_SALE",
                    "direction": "OUT",
                    "quantity": sold_qty,
                    "unit_cost": p["unit_cost"],
                    "reference_doc": f"SO-{random.randint(10000, 99999)}",
                    "notes": "Xuat ban hang khach le & doanh nghiep",
                }
            )
            mov_id += 1

    elif event_type == "INBOUND_PO":
        in_qty = random.randint(20, 60)
        current_stock[(w, p_id)] += in_qty
        po_ref = random.choice(completed_pos)["po_id"]
        movements.append(
            {
                "movement_id": f"MOV-{mov_id:05d}",
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "warehouse_id": w,
                "product_id": p_id,
                "movement_type": "INBOUND_PO",
                "direction": "IN",
                "quantity": in_qty,
                "unit_cost": p["unit_cost"],
                "reference_doc": po_ref,
                "notes": "Nhap hang theo don mua nha cung cap",
            }
        )
        mov_id += 1

    elif event_type == "TRANSFER":
        other_warehouses = [
            wh["warehouse_id"] for wh in warehouses if wh["warehouse_id"] != w
        ]
        dest_w = random.choice(other_warehouses)
        if curr_qty > 10:
            trf_qty = random.randint(4, 10)
            current_stock[(w, p_id)] -= trf_qty
            current_stock[(dest_w, p_id)] += trf_qty
            trf_ref = f"TRF-{random.randint(1000, 9999)}"
            movements.append(
                {
                    "movement_id": f"MOV-{mov_id:05d}",
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "warehouse_id": w,
                    "product_id": p_id,
                    "movement_type": "TRANSFER_OUT",
                    "direction": "OUT",
                    "quantity": trf_qty,
                    "unit_cost": p["unit_cost"],
                    "reference_doc": trf_ref,
                    "notes": f"Dieu chuyen xuat sang {dest_w}",
                }
            )
            mov_id += 1
            arr_time = current_time + datetime.timedelta(hours=random.choice([24, 36]))
            if arr_time < end_time:
                movements.append(
                    {
                        "movement_id": f"MOV-{mov_id:05d}",
                        "timestamp": arr_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "warehouse_id": dest_w,
                        "product_id": p_id,
                        "movement_type": "TRANSFER_IN",
                        "direction": "IN",
                        "quantity": trf_qty,
                        "unit_cost": p["unit_cost"],
                        "reference_doc": trf_ref,
                        "notes": f"Dieu chuyen nhap tu {w}",
                    }
                )
                mov_id += 1
            else:
                current_stock[(dest_w, p_id)] -= trf_qty

    elif event_type == "RETURN_CUSTOMER":
        ret_qty = random.randint(1, 3)
        current_stock[(w, p_id)] += ret_qty
        movements.append(
            {
                "movement_id": f"MOV-{mov_id:05d}",
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "warehouse_id": w,
                "product_id": p_id,
                "movement_type": "RETURN_CUSTOMER",
                "direction": "IN",
                "quantity": ret_qty,
                "unit_cost": p["unit_cost"],
                "reference_doc": f"RMA-{random.randint(1000, 9999)}",
                "notes": "Khach tra hang da kiem tra dat tieu chuan",
            }
        )
        mov_id += 1

    elif event_type == "RETURN_VENDOR":
        if curr_qty > 5:
            ret_v_qty = random.randint(1, 3)
            current_stock[(w, p_id)] -= ret_v_qty
            movements.append(
                {
                    "movement_id": f"MOV-{mov_id:05d}",
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "warehouse_id": w,
                    "product_id": p_id,
                    "movement_type": "RETURN_VENDOR",
                    "direction": "OUT",
                    "quantity": ret_v_qty,
                    "unit_cost": p["unit_cost"],
                    "reference_doc": f"RTV-{random.randint(1000, 9999)}",
                    "notes": "Tra hang loi cho nha cung cap",
                }
            )
            mov_id += 1

    elif event_type == "SCRAP_DAMAGED":
        if curr_qty > 5:
            scrap_qty = random.randint(1, 2)
            current_stock[(w, p_id)] -= scrap_qty
            movements.append(
                {
                    "movement_id": f"MOV-{mov_id:05d}",
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "warehouse_id": w,
                    "product_id": p_id,
                    "movement_type": "SCRAP_DAMAGED",
                    "direction": "OUT",
                    "quantity": scrap_qty,
                    "unit_cost": p["unit_cost"],
                    "reference_doc": f"SCRAP-{random.randint(1000, 9999)}",
                    "notes": "Xuat huy hang can date/hong vo trong kho",
                }
            )
            mov_id += 1

# C. Periodic Physical Audits & Adjustments (4 Quarters)
audit_records = []
audit_id = 1
for q_month, q_date in [
    (3, "2024-03-31"),
    (6, "2024-06-30"),
    (9, "2024-09-30"),
    (12, "2024-12-30"),
]:
    sampled_skus = random.sample(products, 15)
    for p in sampled_skus:
        w = random.choice(warehouses)["warehouse_id"]
        book_q = current_stock[(w, p["product_id"])]
        discrepancy = random.choice([0, 0, 0, -1, -2, 1])
        phys_q = max(0, book_q + discrepancy)
        reason = (
            "NORMAL_VARIANCE"
            if discrepancy == 0
            else ("PILFERAGE" if discrepancy < 0 else "SCAN_CORRECTION")
        )
        audit_records.append(
            {
                "audit_id": f"AUD-{audit_id:04d}",
                "audit_date": q_date,
                "warehouse_id": w,
                "product_id": p["product_id"],
                "book_quantity": book_q,
                "physical_quantity": phys_q,
                "discrepancy_qty": discrepancy,
                "reason_code": reason,
            }
        )
        audit_id += 1

        if discrepancy != 0:
            current_stock[(w, p["product_id"])] += discrepancy
            note_str = (
                "Dieu chinh kiem ke: Ghi tang"
                if discrepancy > 0
                else "Dieu chinh kiem ke: Ghi giam"
            )
            dir_str = "IN" if discrepancy > 0 else "OUT"
            movements.append(
                {
                    "movement_id": f"MOV-{mov_id:05d}",
                    "timestamp": f"{q_date} 23:00:00",
                    "warehouse_id": w,
                    "product_id": p["product_id"],
                    "movement_type": "AUDIT_ADJUSTMENT",
                    "direction": dir_str,
                    "quantity": abs(discrepancy),
                    "unit_cost": p["unit_cost"],
                    "reference_doc": f"AUD-{audit_id-1:04d}",
                    "notes": note_str,
                }
            )
            mov_id += 1

df_clean_movements = pd.DataFrame(movements)
df_clean_movements = df_clean_movements.sort_values(
    by=["timestamp", "movement_id"]
).reset_index(drop=True)
df_clean_audits = pd.DataFrame(audit_records)

# 5. SALES DISPATCHES
dispatches = []
carriers = ["CyberExpress", "FastLogistics VN", "VNPost Logistics", "NinjaVan Hub"]
disp_id = 1

sales_movs = df_clean_movements[df_clean_movements["movement_type"] == "OUTBOUND_SALE"]
for _, row in sales_movs.head(500).iterrows():
    disp_date = row["timestamp"][:10]
    lead_hrs = random.choice([12, 18, 24, 36, 48])
    status = "DELIVERED" if random.random() < 0.94 else "RETURNED"
    dispatches.append(
        {
            "dispatch_id": f"DSP-{disp_id:05d}",
            "order_id": row["reference_doc"],
            "warehouse_id": row["warehouse_id"],
            "dispatch_date": disp_date,
            "delivery_status": status,
            "shipping_carrier": random.choice(carriers),
            "lead_time_hours": lead_hrs,
        }
    )
    disp_id += 1

df_sales_dispatches = pd.DataFrame(dispatches)

# Save clean datasets
df_warehouses.to_csv(os.path.join(CLEAN_DIR, "warehouses.csv"), index=False)
df_products.to_csv(os.path.join(CLEAN_DIR, "products.csv"), index=False)
df_purchase_orders.to_csv(os.path.join(CLEAN_DIR, "purchase_orders.csv"), index=False)
df_clean_movements.to_csv(
    os.path.join(CLEAN_DIR, "inventory_movements.csv"), index=False
)
df_sales_dispatches.to_csv(os.path.join(CLEAN_DIR, "sales_dispatches.csv"), index=False)
df_clean_audits.to_csv(os.path.join(CLEAN_DIR, "inventory_audits.csv"), index=False)

print(f"Clean datasets generated successfully in {CLEAN_DIR}")
print(f"Total movements: {len(df_clean_movements)}")
print(f"Total products: {len(df_products)}")
print(f"Total warehouses: {len(df_warehouses)}")

# 6. GENERATE DIRTY DATASETS (Inject 8 business edge cases)
df_dirty_movements = df_clean_movements.copy()
df_dirty_products = df_products.copy()
df_dirty_pos = df_purchase_orders.copy()
df_dirty_audits = df_clean_audits.copy()

# Edge case 1: Negative stock anomaly
idx_po = df_dirty_movements[df_dirty_movements["movement_type"] == "INBOUND_PO"].index[
    10
]
idx_so = df_dirty_movements[
    df_dirty_movements["movement_type"] == "OUTBOUND_SALE"
].index[15]
df_dirty_movements.loc[idx_po, "timestamp"] = "2024-02-15 18:00:00"
df_dirty_movements.loc[idx_so, "timestamp"] = "2024-02-15 08:00:00"

# Edge case 2: In-Transit transfer mismatch
df_dirty_movements = pd.concat(
    [
        df_dirty_movements,
        pd.DataFrame(
            [
                {
                    "movement_id": "MOV-DIRTY-TRF99",
                    "timestamp": "2024-12-30 14:00:00",
                    "warehouse_id": "WH-HCM01",
                    "product_id": "PROD-005",
                    "movement_type": "TRANSFER_OUT",
                    "direction": "OUT",
                    "quantity": 25,
                    "unit_cost": 85.0,
                    "reference_doc": "TRF-INTRANSIT-88",
                    "notes": "Dang van chuyen lien kho chua co phieu nhap",
                }
            ]
        ),
    ],
    ignore_index=True,
)

# Edge case 3: Scrap damaged items logged with bad negative quantity
df_dirty_movements = pd.concat(
    [
        df_dirty_movements,
        pd.DataFrame(
            [
                {
                    "movement_id": "MOV-DIRTY-SCR01",
                    "timestamp": "2024-05-10 11:00:00",
                    "warehouse_id": "WH-DN01",
                    "product_id": "PROD-012",
                    "movement_type": "SCRAP_DAMAGED",
                    "direction": "OUT",
                    "quantity": -5,
                    "unit_cost": 42.5,
                    "reference_doc": "SCRAP-DIRTY-01",
                    "notes": "Loi nhap so luong am vao cot quantity",
                }
            ]
        ),
    ],
    ignore_index=True,
)

# Edge case 4: Customer return uninspected logged directly
ret_indices = df_dirty_movements[
    df_dirty_movements["movement_type"] == "RETURN_CUSTOMER"
].index
if len(ret_indices) > 0:
    df_dirty_movements.loc[ret_indices[0], "notes"] = "CHUA_KIEM_DINH_PENDING_QA"

# Edge case 5: Audit shrinkage missing adjustment movement
adj_indices = df_dirty_movements[
    df_dirty_movements["movement_type"] == "AUDIT_ADJUSTMENT"
].index[:3]
df_dirty_movements = df_dirty_movements.drop(index=adj_indices)

# Edge case 6: Duplicate barcode scan
dup_row = df_dirty_movements.iloc[50].to_dict()
dup_row["movement_id"] = f"{dup_row['movement_id']}-DUP"
df_dirty_movements = pd.concat(
    [df_dirty_movements, pd.DataFrame([dup_row])], ignore_index=True
)

# Edge case 7: Extreme lead time spike in PO
df_dirty_pos.loc[5, "actual_delivery_date"] = "2024-05-20"

# Edge case 8: Null / 0.0 unit cost on some records
df_dirty_products.loc[3, "unit_cost"] = 0.0
df_dirty_movements.loc[80, "unit_cost"] = np.nan

# Save dirty datasets
df_warehouses.to_csv(os.path.join(DIRTY_DIR, "warehouses.csv"), index=False)
df_dirty_products.to_csv(os.path.join(DIRTY_DIR, "products.csv"), index=False)
df_dirty_pos.to_csv(os.path.join(DIRTY_DIR, "purchase_orders.csv"), index=False)
df_dirty_movements.to_csv(
    os.path.join(DIRTY_DIR, "inventory_movements.csv"), index=False
)
df_sales_dispatches.to_csv(os.path.join(DIRTY_DIR, "sales_dispatches.csv"), index=False)
df_dirty_audits.to_csv(os.path.join(DIRTY_DIR, "inventory_audits.csv"), index=False)

print(f"Dirty datasets generated successfully in {DIRTY_DIR}")
