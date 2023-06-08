const axios = require("axios");

const requestHeaders = {
  authorization: "bearerHeader <JWT>",
  "content-type": "application/json;charset=UTF-8",
};

(async function () {
  // * Lấy thông tin land
  const { data: land } = await axios({
    url: "https://api.plantvsundead.com/lands/get-by-coordinate?x=55&y=25", // đổi tọa độ land tại đây
    headers: requestHeaders,
    method: "GET",
  });

  console.log(land.data[0].slots.map((slot) => slot._id));

  // * Lọc slot cần đuổi quạ và slot cần tưới nước
  const slotsHaveCrow = land.data[0].slots.filter(
    (slot) => slot.actionInfos.isHaveCrow
  );
  const slotsNeedWater = land.data[0].slots.filter(
    (slot) => slot.actionInfos.isNeedWater
  );

  // * Lấy thông tin user
  const { data: user } = await axios({
    url: "https://api.plantvsundead.com/users/userInfo",
    headers: requestHeaders,
    method: "GET",
  });

  // * Nếu số lượng tool đuổi quạ thấp hơn quạ cần đuổi, mua thêm tool
  if (user.data.chaseCrowTools < slotsHaveCrow.length) {
    const { data: res } = await axios({
      url: "https://api.plantvsundead.com/shops/buy-tools",
      headers: requestHeaders,
      data: {
        toolType: 2,
        quantity: slotsHaveCrow.length - user.data.chaseCrowTools,
      },
      method: "POST",
    });
    console.log("Kết quả mua tool đuổi quạ", res);
  }

  // * Nếu số lượng tool tưới nước thấp hơn cây cần tưới, mua thêm tool
  if (user.data.wateringTools < slotsNeedWater.length) {
    const { data: res } = await axios({
      url: "https://api.plantvsundead.com/shops/buy-tools",
      headers: requestHeaders,
      data: {
        toolType: 1,
        quantity: slotsHaveCrow.length - user.data.chaseCrowTools,
      },
      method: "POST",
    });
    console.log("Kết quả mua tool tưới nước", res);
  }

  // * Đuổi quạ
  slotsHaveCrow.forEach(async (slot) => {
    const { data: res } = await axios({
      url: "https://api.plantvsundead.com/farms/chase-crow",
      headers: requestHeaders,
      data: { slotId: slot._id },
      method: "POST",
    });
    console.log("Kết quả đuổi quạ", res);
  });

  // * Tưới nước
  slotsNeedWater.forEach(async (slot) => {
    const { data: res } = await axios({
      url: "https://api.plantvsundead.com/farms/water-plant",
      headers: requestHeaders,
      data: { slotId: slot._id },
      method: "POST",
    });
    console.log("Kết quả tưới nước", res);
  });
})();
