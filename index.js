const axios = require("axios");

const requestHeaders = {
  authorization: "bearerHeader " + process.env.PVU_JWT,
  "content-type": "application/json;charset=UTF-8",
};

async function chaseCrowAndWatering(x, y) {
  // * Lấy thông tin land
  const { data: land } = await axios({
    url: `https://api.plantvsundead.com/lands/get-by-coordinate?x=${x}&y=${y}`, // đổi tọa độ land tại đây
    headers: requestHeaders,
    method: "GET",
  });

  // console.log(land.data[0].slots.map((slot) => slot._id));

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
  await Promise.all(
    slotsHaveCrow.map(async (slot) => {
      const { data: res } = await axios({
        url: "https://api.plantvsundead.com/farms/chase-crow",
        headers: requestHeaders,
        data: { slotId: slot._id },
        method: "POST",
      });
      console.log("Kết quả đuổi quạ", res);
    })
  );

  // * Tưới nước
  await Promise.all(
    slotsNeedWater.map(async (slot) => {
      const { data: res } = await axios({
        url: "https://api.plantvsundead.com/farms/water-plant",
        headers: requestHeaders,
        data: { slotId: slot._id },
        method: "POST",
      });
      console.log("Kết quả tưới nước", res);
    })
  );
}

async function harvestAllPlants(x, y) {
  // * Lấy thông tin land
  const { data: land } = await axios({
    url: `https://api.plantvsundead.com/lands/get-by-coordinate?x=${x}&y=${y}`, // đổi tọa độ land tại đây
    headers: requestHeaders,
    method: "GET",
  });

  const slotIds = land.data[0].slots.map((slot) => slot._id);

  // * Thu hoạch
  const { data: res } = await axios({
    url: "https://api.plantvsundead.com/farms/harvest-plant",
    headers: requestHeaders,
    data: { slotIds },
    method: "POST",
  });
  console.log("Kết quả thu hoạch", res);
}

function setImmediateThenInterval(func, seconds) {
  setImmediate(func);
  setInterval(func, seconds * 1000);
}

(() => {
  setImmediateThenInterval(async () => {
    await chaseCrowAndWatering(55, 25);
    await harvestAllPlants(55, 25);
  }, 60);
})();
