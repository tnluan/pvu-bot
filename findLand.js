let map = ''

fetch('https://pvuhelper.info:8081/103.116.39.189:1569/listlandmap.txt').then(res => res.text()).then(text => map = text)

map.split('\r\n').forEach(land => {
  const slots = land.split('|')
  const mapping = slots.splice(1).reduce((acc, cur) => ({
    ...acc, [cur.substr(0, 3)]: cur.substr(4, 1)
  }), {})

  let has7SlotInSameColumn = false

  for (let i = 1; i < 7; ++i) {
    let has7Slot = true

    for (let j = 0; j < 7; ++j) {
      if (mapping[i + '-' + j] !== '0') has7Slot = false
    }

    if (has7Slot) has7SlotInSameColumn = true
  }

  if (has7SlotInSameColumn) {
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

    if (diagonalCount >= 4) {
      console.log(slots, diagonalCount)
    }
  }
})
