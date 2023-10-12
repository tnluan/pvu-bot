const axios = require("axios");
const jwt_decode = require("jwt-decode");
const { consola } = require("consola");
require("dotenv").config();

const PVU_JWT = process.env.PVU_JWT;

const requestHeaders = {
  authorization: "bearerHeader " + PVU_JWT,
  "content-type": "application/json;charset=UTF-8",
};

async function chaseCrowAndWatering(x, y) {
  // * Lấy địa chỉ ví dùng để lọc những slot có ownerId trùng với địa chỉ này
  const { publicAddress } = jwt_decode(PVU_JWT);

  // * Lấy thông tin land
  const { data: land } = await axios({
    url: `https://api.plantvsundead.com/lands/get-by-coordinate?x=${x}&y=${y}`, // đổi tọa độ land tại đây
    headers: requestHeaders,
    method: "GET",
  });

  // consola.info(land.data[0].slots.map((slot) => slot._id));

  // * Lọc slot cần đuổi quạ và slot cần tưới nước
  const slotsHaveCrow = land.data[0].slots.filter(
    (slot) => slot.actionInfos.isHaveCrow && slot.ownerId === publicAddress
  );
  const slotsHaveGoodCrow = land.data[0].slots.filter(
    (slot) => slot.decoEffects.isGoodCrow && slot.ownerId === publicAddress
  );
  const slotsNeedWater = land.data[0].slots.filter(
    (slot) => slot.actionInfos.isNeedWater && slot.ownerId === publicAddress
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
        toolType: 1,
        quantity: slotsHaveCrow.length - user.data.chaseCrowTools,
      },
      method: "POST",
    });
    consola.success("Kết quả mua tool đuổi quạ", res);
  }

  // * Nếu số lượng tool tưới nước thấp hơn cây cần tưới, mua thêm tool
  if (user.data.wateringTools < slotsNeedWater.length) {
    const { data: res } = await axios({
      url: "https://api.plantvsundead.com/shops/buy-tools",
      headers: requestHeaders,
      data: {
        toolType: 2,
        quantity: slotsNeedWater.length - user.data.wateringTools,
      },
      method: "POST",
    });
    consola.success("Kết quả mua tool tưới nước", res);
  }

  // * Đuổi quạ xấu
  await Promise.all(
    slotsHaveCrow.map(async (slot) => {
      const { data: res } = await axios({
        url: "https://api.plantvsundead.com/farms/chase-crow",
        headers: requestHeaders,
        data: { slotId: slot._id },
        method: "POST",
      });
      consola.success("Kết quả đuổi quạ xấu", res);
    })
  );

  // * Đuổi quạ tốt
  await Promise.all(
    slotsHaveGoodCrow.map(async (slot) => {
      const { data: res } = await axios({
        url: "https://api.plantvsundead.com/farms/chase-good-crow",
        headers: requestHeaders,
        data: { slotId: slot._id },
        method: "POST",
      });
      consola.success("Kết quả đuổi quạ tốt", res);
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
      consola.success("Kết quả tưới nước", res);
    })
  );
}

async function harvestAllPlants(x, y) {
  // * Lấy địa chỉ ví dùng để lọc những slot có ownerId trùng với địa chỉ này
  const { publicAddress } = jwt_decode(PVU_JWT);

  // * Lấy thông tin land
  const { data: land } = await axios({
    url: `https://api.plantvsundead.com/lands/get-by-coordinate?x=${x}&y=${y}`, // đổi tọa độ land tại đây
    headers: requestHeaders,
    method: "GET",
  });

  const slotsNeedHarvest = land.data[0].slots.filter(
    (slot) =>
      slot.harvestTime &&
      slot.harvestTime < Date.now() &&
      slot.ownerId === publicAddress
  );

  // * Thu hoạch
  const { data: res } = await axios({
    url: "https://api.plantvsundead.com/farms/harvest-plant",
    headers: requestHeaders,
    data: { slotIds: slotsNeedHarvest.map((slot) => slot._id) },
    method: "POST",
  });
  consola.success("Kết quả thu hoạch", res);
}

async function stealAroundPlants(x, y) {
  // * Lấy địa chỉ ví dùng để lọc những slot có ownerId khác với địa chỉ này
  const { publicAddress } = jwt_decode(PVU_JWT);

  const aroundPlants = [
    [x - 1, y - 1],
    [x - 1, y],
    [x - 1, y + 1],
    [x, y - 1],
    [x, y],
    [x, y + 1],
    [x + 1, y - 1],
    [x + 1, y],
    [x + 1, y + 1],
  ];

  for (const coordinate of aroundPlants) {
    // * Lấy thông tin land
    const { data: land } = await axios({
      url: `https://api.plantvsundead.com/lands/get-by-coordinate?x=${coordinate[0]}&y=${coordinate[1]}`,
      headers: requestHeaders,
      method: "GET",
    });

    const slotsNeedSteal = land.data[0].slots.filter(
      (slot) =>
        slot.harvestTime &&
        slot.harvestTime < Date.now() &&
        slot.ownerId !== publicAddress &&
        [1, 4, 5, 6, 7, 8].includes(slot.plantInfos.faction)
    );

    for (const slot of slotsNeedSteal) {
      // * Thu hoạch trộm
      const { data: res } = await axios({
        url: "https://api.plantvsundead.com/farms/steal",
        headers: requestHeaders,
        data: { slotId: slot._id },
        method: "POST",
      });
      consola.success("Kết quả thu hoạch trộm", coordinate, slot._id, res);
    }
  }
}

function setImmediateThenInterval(func, seconds) {
  setImmediate(func);
  setInterval(func, seconds * 1000);
}

(() => {
  setImmediateThenInterval(async () => {
    try {
      await chaseCrowAndWatering(23, 40);
      await chaseCrowAndWatering(23, 41);
      await chaseCrowAndWatering(23, 42);

      await harvestAllPlants(23, 40);
      await harvestAllPlants(23, 41);
      await harvestAllPlants(23, 42);

      await stealAroundPlants(23, 41);
    } catch (err) {
      consola.error(err.response.data.data);
    }
  }, 120);
})();
