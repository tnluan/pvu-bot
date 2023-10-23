let map = ''

fetch('https://pvuhelper.info:8081/103.116.39.158:1569/listlandmap.txt').then(res => res.text()).then(text => map = text)

map.split('\r\n').forEach(land => {
  const slots = land.split('|')
  const mapping = slots.splice(1).reduce((acc, cur) => ({
    ...acc, [cur.substr(0, 3)]: cur.substr(4, 1)
  }), {})

  let has6SlotInSameColumn = false
  let has6SlotInSameRow = false

  for (let i = 1; i < 7; ++i) {
    let has6SlotCont = true

    for (let j = 0; j < 6; ++j) {
      if (mapping[i + '-' + j] !== '0') has6SlotCont = false
    }

    if (!has6SlotCont) {
      has6SlotCont = true

      for (let j = 1; j < 7; ++j) {
        if (mapping[i + '-' + j] !== '0') has6SlotCont = false
      }
    }

    if (has6SlotCont) has6SlotInSameColumn = true
  }

  if (has6SlotInSameColumn) {
    for (let i = 0; i < 6; ++i) {
      let has6SlotCont = true

      for (let j = 0; j < 6; ++j) {
        if (mapping[j + '-' + i] !== '0') has6SlotCont = false
      }

      if (!has6SlotCont) {
        has6SlotCont = true

        for (let j = 1; j < 7; ++j) {
          if (mapping[j + '-' + i] !== '0') has6SlotCont = false
        }
      }

      if (has6SlotCont) has6SlotInSameRow = true
    }
  }

  if (has6SlotInSameColumn && has6SlotInSameRow) {
    let diagonalCount = 0

    for (let i = 1; i < 6; ++i) {
      for (let j = 1; j < 6; ++j) {
        if (
          mapping[i + '-' + j] === '0' &&
          mapping[(i - 1) + '-' + (j - 1)] === '0' &&
          mapping[(i - 1) + '-' + (j + 1)] === '0' &&
          mapping[(i + 1) + '-' + (j - 1)] === '0' &&
          mapping[(i + 1) + '-' + (j + 1)] === '0'
        ) {
          diagonalCount++
        }
      }
    }

    if (diagonalCount >= 2) {
      console.log(slots, diagonalCount)
    }
  }
})
