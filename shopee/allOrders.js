async function getOrders(offset, limit) {
    let url = "https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=" + limit + "&offset=" + offset;
    var ordersData = (await (await fetch(url)).json()).data.order_data;

    var detailList = ordersData.details_list;
    if (detailList) {
        return detailList;
    } else {
        return [];
    }
}

function _VietNamCurrency(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

async function getAllOrders() {
    const limit = 20;
    let offset = 0;
    let allOrders = [];
    let yearlySpending = {}; // To store spending by year
    let unknownSpending = { spent: 0, orders: 0, items: 0 }; // For orders with unknown time

    allOrders.push(
        [
            'Ngày giờ\tTổng tiền', 'Tên chung', 'Số lượng', 'Trạng thái', 'Tên shop', 'Chi tiết'
        ].join('\t')
    );

    let totalSpent = 0;
    let totalItems = 0;
    let totalOrders = 0;
    let currentYear = null;

    while (true) {
        let data = await getOrders(offset, limit);
        if (data.length == 0) break;

        for (const item of data) {
            const infoCard = item.info_card;
            const listType = item.list_type;
            const ctime = item.shipping?.tracking_info?.ctime;
            const orderDate = ctime ? new Date(ctime * 1000) : null;
            const year = orderDate ? orderDate.getFullYear() : currentYear || "Unknown time";
            const formattedDate = orderDate ? orderDate.toLocaleString('vi-VN') : "Unknown";

            if (!yearlySpending[year]) {
                yearlySpending[year] = { spent: 0, orders: 0, items: 0 };
            }

            if (currentYear !== year) {
                allOrders.push("\n-------------------------" + `\nNăm ${year === "Unknown time" ? "Unknown time" : year}\n-------------------------`);
                currentYear = year;
            }

            let strListType;
            switch (listType) {
                case 3: strListType = "Hoàn thành"; break;
                case 4: strListType = "Đã hủy"; break;
                case 7: strListType = "Vận chuyển"; break;
                case 8: strListType = "Đang giao"; break;
                case 9: strListType = "Chờ thanh toán"; break;
                case 12: strListType = "Trả hàng"; break;
                default: strListType = "Không rõ"; break;
            }

            const productCount = infoCard.product_count;
            let subTotal = infoCard.subtotal / 1e5;

            const orderCard = infoCard.order_list_cards[0];
            const shopName = orderCard.shop_info.username + " - " + orderCard.shop_info.shop_name;
            const products = orderCard.product_info.item_groups;
            const productSummary = products.map(product => product.items.map(item => item.name.replace(/\n/g, " ") + "--amount: " + item.amount + "--price: " + _VietNamCurrency(item.item_price)).join(', ')).join('; ');
            const name = products[0].items[0].name.replace(/\n/g, " ");

            if (listType != 4 && listType != 12) {
                totalSpent += subTotal;
                yearlySpending[year].spent += subTotal;
                yearlySpending[year].orders += 1;
                yearlySpending[year].items += productCount;
            } else {
                subTotal = 0;
            }

            totalOrders += 1;
            totalItems += productCount;
            const subTotalNative = _VietNamCurrency(subTotal);

            allOrders.push(
                [
                    `${formattedDate}\t${subTotalNative}`, name, productCount, strListType, shopName, productSummary
                ].join('\t')
            );
        }

        console.log('Collected: ' + offset);
        offset += limit;
    }

    allOrders.push("\n\n-------------------------" +
                   "\nChi tiêu theo năm\n" +
                   "-------------------------");

    for (const year in yearlySpending) {
        const currentYear = new Date().getFullYear();
        if (year === "Unknown time" || (!isNaN(year) && year <= currentYear)) { // Include valid years and unknown time
            allOrders.push(
                `${year === "Unknown time" ? "Unknown time" : `Năm ${year}`}:
  - Tổng tiền chi tiêu: ${_VietNamCurrency(yearlySpending[year].spent)}
  - Tổng đơn hàng: ${yearlySpending[year].orders} đơn hàng
  - Tổng sản phẩm: ${yearlySpending[year].items} sản phẩm
`
            );
        }
    }

    allOrders.push("\n-------------------------" +
                   "\nTổng chi tiêu tất cả các năm\n-------------------------");

    allOrders.push(
        `Tổng tiền chi tiêu: ${_VietNamCurrency(totalSpent)}\n` +
        `Tổng đơn hàng: ${totalOrders} đơn hàng\n` +
        `Tổng sản phẩm: ${totalItems} sản phẩm\n`
    );

    var text = allOrders.join('\r\n');
    document.write('<textarea>' + text + '</textarea>');
}

getAllOrders();