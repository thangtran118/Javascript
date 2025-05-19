async function getOrders(offset, limit) {
    let url = "https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=" + limit + "&offset=" + offset;
    var ordersData = (await (await fetch(url)).json()).data.order_data;

    var detailList = ordersData.details_list
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
    allOrders.push(
        [
            'Tên chung', 'Số lượng', 'Tổng tiền', 'Trạng thái', 'Tên shop', 'Chi tiết', 'Tiền gốc'
        ].join('\t')
    )
    let sum = 0;
    let count = 0;
    while (true) {
        let data = await getOrders(offset, limit);
        if (data.length == 0)
            break;
        for (const item of data) {
            const infoCard = item.info_card;
            const listType = item.list_type;
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
            count += productCount;
            const orderCard = infoCard.order_list_cards[0];
            const shopName = orderCard.shop_info.username + " - " + orderCard.shop_info.shop_name;
            const products = orderCard.product_info.item_groups;
            const productSumary = products.map(product => product.items.map(item => item.name + "--amount: " + item.amount + "--price: " + _VietNamCurrency(item.item_price)).join(', ')).join('; ');
            const name = products[0].items[0].name;
            if (listType != 4 && listType != 12)
                sum += subTotal;
            else
                subTotal = 0;

            const subTotalNative = _VietNamCurrency(subTotal);
            allOrders.push(
                [
                    name, productCount, subTotalNative, strListType, shopName, productSumary, subTotal
                ].join('\t')
            );

        }
        console.log('Colected: ' + offset);
        offset += limit;
    }

    allOrders.push(
        [
            'Tổng cộng: ', count, _VietNamCurrency(sum)
        ].join('\t')
    );
    var text = allOrders.join('\r\n');
    document.write('<textarea>' + text + '</textarea>');
}
getAllOrders();