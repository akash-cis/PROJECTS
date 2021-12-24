import { filterByRange, substractDays } from "../../library/optionsWrapper"
import { map, sumBy, groupBy, isEmpty } from "lodash"
// deals
export const DEAL = "DEAL"
export const ACTIVE = "Active"
export const WON = "Deal Won"
export const LOST = "Deal Lost"
export const PUSHED_CRM = "Pushed to CRM"
export const EXPIRED = "Expired"
export const ARCHIVE = "Archive"

// leads
export const PROSPECT = "Prospect"
export const ACCEPTED = "Accepted"
export const REJECTED = "Rejected"
export const SAVED = "Saved"
export const VIEWED = "Viewed"
export const AVAILABLE = "Available"

// client
export const STARRED = "Starred"
export const APPROVED = "Approved"
export const ENGAGED = "Engaged"

//spec
export const ENGAGED_SPEC = [ACCEPTED, SAVED]
export const CONVERTED_SPEC = [WON, PUSHED_CRM]

// propspects analytics
// export const STARRED = "Saved"
// export const CONVERTED = WON
// export const APPROVED = "Accepted"
// export const ENGAGED = APPROVED
// export const PROVIDED = "Viewed"

export const getTotal = data => data.reduce((acc, curr) => acc + curr.count, 0)

export const getTotals = data =>
  data.reduce((acc, curr) => {
    if (acc[curr.status]) {
      return { ...acc, [curr.status]: curr.count + acc[curr.status] }
    }
    return { ...acc, [curr.status]: curr.count }
  }, {})

export const getTotalsByKeys = (data, keys) =>
  data.reduce((acc, curr) => {
    let ob = {}
    keys.forEach(key => {
      if (acc[key]) {
        return (ob[key] = curr[key] + acc[key])
      }
      ob[key] = curr[key]
    })
    return ob
  }, {})

export const filterByStatus = data => status => {
  if (data.length <= 0) return 0

  if (typeof status === "string") {
    status = [status]
  }

  return data.filter(kpi => status.indexOf(kpi.status) >= 0).flat()
}
// filters the data and get the count based on the status
export const countByStatus = data => status => {
  if (data.length <= 0) return 0

  return filterByStatus(data)(status).reduce((acc, curr) => acc + curr.count, 0)
}

export const getChange = (newValue, oldValue) => {
  const change =
    oldValue > 0
      ? Number((((newValue - oldValue) / oldValue) * 100).toFixed(0))
      : 0
  if (Number.isNaN(change)) return "-"
  if (change === Infinity) return "*"
  return change
}

export const prospectAnalysis = (data, range) => {
  const ENGAGED = [ACCEPTED, SAVED]
  const CONVERTED = [WON, PUSHED_CRM]
  let a = new Date()
  a.setHours(0, 0, 0, 0)

  const rangedData = filterByRange(data, range / 2)

  const previousDate = substractDays(new Date().setHours(0, 0, 0, 0), range / 2)
  const previousData = filterByRange(data, range / 2, previousDate)
  // actual
  const actualProvided = countByStatus(rangedData)([AVAILABLE])
  const actualEngaged = countByStatus(rangedData)(ENGAGED)
  const actualConverted = countByStatus(rangedData)(CONVERTED)

  // previous
  const previousProvided = countByStatus(previousData)([AVAILABLE])
  const previousEngaged = countByStatus(previousData)(ENGAGED)
  const previousConverted = countByStatus(previousData)(CONVERTED)

  return [
    {
      title: "Leads Available",
      count: actualProvided,
      change: getChange(actualProvided, previousProvided),
      previous: previousProvided,
    },
    {
      title: "Engaged With",
      count: actualEngaged,
      change: getChange(actualEngaged, previousEngaged),
      previous: previousEngaged,
    },
    {
      title: "Leads converted",
      count: actualConverted,
      change: getChange(actualConverted, previousConverted),
      previous: previousConverted,
    },
  ]
}

export const engagedConverted = (data, range) => {
  const engaged = countByStatus(data)([ACCEPTED, SAVED])
  const converted = countByStatus(data)([WON, PUSHED_CRM])

  if (engaged === 0 && converted === 0) return null
  return [
    { type: "Engaged", value: engaged },
    { type: "Converted", value: converted },
  ]
}

// this is how it should look

// const prospectUsage = [
//   { date: "07-20-2019", Engaged: 2, Approved: 2, Starred: 8 },
//   { date: "07-21-2019", Engaged: 6, Approved: 2, Starred: 16 },
//   { date: "07-22-2019", Engaged: 8, Approved: 3, Starred: 24 },
//   { date: "07-23-2019", Engaged: 10, Approved: 14, Starred: 32 },
//   { date: "07-24-2019", Engaged: 5, Approved: 12, Starred: 17 },
//   { date: "07-25-2019", Engaged: 18, Approved: 10, Starred: 20 },
// ]

// we convert our data to a structure like the above and sort it
// spec:
// Engaged: Accepted + Saved
// Approved: Accepted
// Starred: Saved
export const prospectUsageOverTime = data => {
  const KEY = "date"
  const mapStatus = {
    [ACCEPTED]: APPROVED,
    [SAVED]: STARRED,
  }
  const initial = { [ENGAGED]: 0, [APPROVED]: 0, [STARRED]: 0 }
  const keys = Object.keys(initial)
  let newData = data
    .filter(kpi => kpi.source !== DEAL && mapStatus[kpi.status])
    .map(kpi => {
      return {
        date: kpi.date,
        ...initial,
        [mapStatus[kpi.status]]: kpi.count,
      }
    })
  const onKpi = kpi => ({
    ...kpi,
    [ENGAGED]: kpi[APPROVED] + kpi[STARRED],
  })
  const newArray = squashByKey(newData, KEY, keys, onKpi)
  return newArray.sort((a, b) => new Date(a.date) - new Date(b.date))
}

// const teamManagement = [
//   { date: "S. Pikand", value: 10 },
//   { date: "K. Pohl", value: 21 },
//   { date: "M. Arro", value: 2 },
//   { date: "S. Kamma", value: 16 },
// ]
export const teamManagement = data => {
  const engaged = filterByStatus(data)(ENGAGED_SPEC)
  if (engaged === 0) return null
  const newData = engaged.map(item => ({
    name: item.userName,
    count: item.count,
  }))

  let newArray = []
  newData.forEach(kpi => {
    const sameNameKpi = newArray.find(newKpi => newKpi.name == kpi.name)
    if (sameNameKpi) {
      newArray = newArray.filter(newKpi => newKpi.name !== sameNameKpi.name)
      return newArray.push({ ...sameNameKpi, ...kpi })
    }
    newArray.push(kpi)
  })
  const totals = getTotals(data)
  return { data: newArray, value: totals[SAVED] + totals[ACCEPTED] }
}
// const prospectUsage = [
//   { date: "07-20-2019", Engaged: 10, Approved: 2, Starred: 8, Won: 10 },
// ]
export const prospectUsage = data => {
  const usage = [
    {
      date: "07-20-2019",
      Engaged: countByStatus(data)(ENGAGED_SPEC),
      Approved: countByStatus(data)(ACCEPTED),
      Starred: countByStatus(data)(SAVED),
      Won: countByStatus(data)(CONVERTED_SPEC),
    },
  ]
  return usage
}

// const dataSource = [
//   {
//     tag: "Yo",
//     name: "Carmen Beltran",
//     time: "1h 27min",
//     engaded: 18,
//     provided: 13,
//     converted: 12,
//     crm: 15,
//     conversion: 20,
//   },
//   {
//     tag: "Yo",
//     name: "Gopichad Sana",
//     time: "1h 27min",
//     engaded: 18,
//     provided: 13,
//     converted: 12,
//     crm: 15,
//     conversion: 20,
//   },
// ]

// we are mutating whaeve' here
export const teamLeaderboard = data => {
  // const mapStatus = {
  //   [WON]: "converted",
  //   [PUSHED_CRM]: "crm",
  // }
  // const initial = {
  //   engaged: 0,
  //   provided: 0,
  //   crm: 0,
  //   converted: 0,
  //   [ACCEPTED]: 0,
  //   [SAVED]: 0,
  //   [VIEWED]: 0,
  // }
  const keys = ["time", "engaged", "provided", "crm", "converted"]
  // const newData = data.map(kpi => {
  //   const mapped = mapStatus[kpi.status] ? mapStatus[kpi.status] : kpi.status
  //   return {
  //     name: kpi.userName,
  //     ...initial,
  //     [mapped]: kpi.count,
  //   }
  // })
  const onKpi = kpi => {
    const conversion = ((kpi.converted + kpi.crm) * 100) / kpi.engaged

    return {
      ...kpi,
      conversion: conversion ? conversion.toFixed(0) : 0,
    }
  }
  const newArray = squashByKey(data, "userName", keys, onKpi)
  return {
    items: newArray.sort((b, a) => a.conversion - b.conversion),
    totals: getTotalsByKeys(data, keys),
  }
}

// {
//   name: 'asfasf',
//   current: 23,
//   previous: 34
// }
export const managerAppUsage = (data, range) => {
  const rangedData = filterByRange(data, range / 2)

  const previousDate = substractDays(new Date().setHours(0, 0, 0, 0), range / 2)
  const previousData = filterByRange(data, range / 2, previousDate)

  const key = "userName"
  const keys = ["userName", "time", "date"]
  const sumKey = "time"
  const oldArray = squashByKeySumByOther(previousData, key, keys, sumKey)

  const cb = obj => {
    const oldTime = oldArray.find(old => old.userName === obj.userName)
    return {
      userName: obj.userName,
      time: obj.time,
      previous: oldTime?.time || 0,
    }
  }
  const newArray = squashByKeySumByOther(rangedData, key, keys, sumKey, cb)
  return newArray
}

// change the structure of the object
// search for the key
// if the key is repeated, squash the items in the same object
// export const squashByKey = data => key => {
//   const newData = data.map(kpi => ({
//     [key]: kpi[key],
//     [kpi.status]: kpi.count,
//   }))
//   let newArray = []
//   newData.forEach(kpi => {
//     const match = newArray.find(newKpi => newKpi[key] == kpi[key])
//     if (match) {
//       newArray = newArray.filter(newKpi => newKpi[key] !== match[key])
//       return newArray.push({ ...match, ...kpi })
//     }
//     newArray.push(kpi)
//   })
// }

export const squashByKey = (data, key, keys, cb = kpi => kpi) => {
  let newArray = []
  // we apply the callback just before pushing it
  const pushKpi = key => {
    newArray.push(cb(key))
  }
  data.forEach(kpi => {
    const cbKpi = cb(kpi)
    const sameNameKpi = newArray.find(newKpi =>
      newKpi && newKpi[key] ? newKpi[key] === cbKpi[key] : null
    )
    if (sameNameKpi) {
      let ob = {}
      newArray = newArray.filter(newKpi => newKpi[key] !== sameNameKpi[key])
      keys.forEach(_key => {
        const f = sameNameKpi[_key] || 0
        const g = cbKpi[_key] || 0
        ob[key] = cbKpi[key]
        ob[_key] = f + g
      })
      if (ob[key]) return pushKpi(ob)
    }
    pushKpi(cbKpi)
  })
  return newArray
}

export const squashByKeySumByOther = (
  data,
  key,
  keys,
  sumKey,
  cb = kpi => kpi
) => {
  let newArray = []
  // we apply the callback just before pushing it
  const pushKpi = key => {
    newArray.push(cb(key))
  }
  data.forEach(kpi => {
    const cbKpi = cb(kpi)
    const sameNameKpi = newArray.find(newKpi =>
      newKpi && newKpi[key] ? newKpi[key] === cbKpi[key] : null
    )
    if (sameNameKpi) {
      let ob
      newArray = newArray.filter(newKpi => newKpi[key] !== sameNameKpi[key])
      if (cbKpi[sumKey] >= 0 && typeof sameNameKpi[sumKey] === "number") {
        ob = { ...sameNameKpi, [sumKey]: sameNameKpi[sumKey] + cbKpi[sumKey] }
      }
      if (ob) return pushKpi(ob)
    }
    pushKpi(cbKpi)
  })
  return newArray
}

export const leadBySource = data => {
  const summed = map(groupBy(data, "source"), (o, idx) => {
    return { id: idx, summed: sumBy(o, "count") }
  })

  if (!isEmpty(summed)) {
    let newObj = { id: 1 }
    summed.forEach((el, index) => {
      newObj = { ...newObj, [el.id]: el.summed }
    })
    return [{ ...newObj }]
  } else {
    return []
  }
}

export const leadAnalysis = (data, range) => {
  const UNRESPONDED = ["SENT", "DELIVERED", "OPT_PUT"]
  const RESPONDED = ["RESPONDED"]
  const ENGAGED = ["ENGAGED"]

  const rangedData = filterByRange(data, range / 2)
  const previousDate = substractDays(new Date().setHours(0, 0, 0, 0), range / 2)
  const previousData = filterByRange(data, range / 2, previousDate)

  // actual
  const actualUnresponded = countByStatus(rangedData)(UNRESPONDED)
  const actualEngaged = countByStatus(rangedData)(ENGAGED)
  const actualResponded = countByStatus(rangedData)(RESPONDED)
  const totalLeads = countByStatus(rangedData)("N/A")

  // previous
  const previousTotalLeads = countByStatus(previousData)("N/A")

  return [
    {
      title: "Total Leads",
      count: totalLeads,
      change: getChange(totalLeads, previousTotalLeads),
      previous: previousTotalLeads,
    },
    {
      title: "Responded/Unresponded",
      count: actualResponded,
      previous: actualUnresponded,
      compareType: true,
    },
    {
      title: "Single Response/Engagements",
      count: actualResponded,
      previous: actualEngaged,
      compareType: true,
    },
  ]
}

export const getAttemptName = item => {
  let name = ""
  switch (item) {
    case "1":
      name = "1st Attempt"
      break
    case "2":
      name = "2nd Attempt"
      break
    case "3":
      name = "3rd Attempt"
      break
    case "4":
      name = "4th Attempt"
      break
    case "5":
      name = "5th Attempt"
      break
    default:
      break
  }
  return name
}

export const responseByEngagement = data => {
  let _summed = map(groupBy(data, "attempts"), (o, idx) => {
    const name = getAttemptName(idx)
    return { id: name, summed: sumBy(o, "count") }
  })
  const summed = _summed.filter(el => el.id != 0)

  let newObj = { id: 1 }
  if (!isEmpty(summed)) {
    summed.forEach((el, index) => {
      newObj = { ...newObj, [el.id]: el.summed }
    })
    return [{ ...newObj }]
  } else {
    return []
  }
}

export const responseByAppointments = data => {
  const summed = map(groupBy(data, "status"), (o, idx) => {
    return { id: idx, summed: sumBy(o, "count") }
  })
  let newObj = { id: 1 }
  if (!isEmpty(summed)) {
    summed.forEach((el, index) => {
      newObj = { ...newObj, [el.id]: el.summed }
    })
    return [{ ...newObj }]
  } else {
    return []
  }
}

export const activityAnalysis = (data, range) => {
  const SENT = ["SENT", "DELIVERED"]
  const RECEIVED = ["RESPONDED", "OPT_PUT"]
  const ENGAGED = ["ENGAGED"]
  const APPOINTMENT = ["APPOINTMENT"]
  //const RECEIVED = ["RESPONDED"]
  const rangedData = filterByRange(data, range / 2)

  const previousDate = substractDays(new Date().setHours(0, 0, 0, 0), range / 2)
  const previousData = filterByRange(data, range / 2, previousDate)

  // actual
  const actualSent = countByStatus(rangedData)(SENT)
  const actualReceived = countByStatus(rangedData)(RECEIVED)
  const actualEnagaged = countByStatus(rangedData)(ENGAGED)
  const actualAppointment = countByStatus(rangedData)(APPOINTMENT)

  const totalLeads = actualSent + actualReceived + actualEnagaged

  // previous
  const previousSent = countByStatus(previousData)(SENT)
  const previousReceived = countByStatus(previousData)(RECEIVED)
  const previousEngaged = countByStatus(previousData)(ENGAGED)
  const previousTotalLeads = previousSent + previousReceived + previousEngaged

  const respRate =
    actualSent > 0 && actualReceived > 0
      ? Number((actualReceived * 100) / actualSent).toFixed(2)
      : 0
  const prevRespRate =
    previousSent > 0 && previousReceived > 0
      ? Number((previousReceived * 100) / previousSent).toFixed(2)
      : 0
  return [
    {
      title: "Total Messages",
      count: totalLeads,
      change: getChange(totalLeads, previousTotalLeads),
      previous: previousTotalLeads,
    },
    {
      title: "Total Messages Sent",
      count: actualSent,
      change: getChange(actualSent, previousSent),
      previous: previousSent,
    },
    {
      title: "Response Rate",
      count: respRate,
      change: getChange(respRate, 45),
      previous: prevRespRate,
      isPercentage: true,
    },
    {
      title: "Number of Engagements vs Appointments",
      count: actualEnagaged,
      previous: actualAppointment,
      compareType: true,
    },
  ]
}

export const appointmentsBySalesPerson = data => {
  const summed = map(groupBy(data, "userName"), (o, idx) => {
    return { id: idx, summed: sumBy(o, "count") }
  })
  let newObj = { id: 1 }
  if (!isEmpty(summed)) {
    summed.forEach((el, index) => {
      newObj = { ...newObj, [el.id]: el.summed }
    })
    return [{ ...newObj }]
  } else {
    return []
  }
}
