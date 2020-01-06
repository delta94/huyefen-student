import moment from 'moment';
import _ from 'lodash';

export const fromNow = unixTime => {
    const diff = moment().dayOfYear() - moment(unixTime).dayOfYear();
    if (diff === 0) return moment(unixTime).format("H:mm");
    if (diff < 7) return moment(unixTime).format("ddd");
    else return moment(unixTime).format("MMM D");
};

export const truncate = (str, len) => {
    return _.truncate(str, {
        'length': len,
        'separator': /,? +/
    });
};

export const range = n => {
    let i = 0;
    const result = [];
    while (i < n) {
        result.push(i);
        i++;
    }
    return result;
};

export const toQueryString= json => {
    return Object.keys(json)
      .map(k => `${k}=${encodeURIComponent(json[k])}`)
      .join('&');
};

export const delay = ms => new Promise((res, rej) => setTimeout(res, ms));

export const findLimit = (data, minimum, number = false) => {
    const length = !number ? data.length : data;
    let i = minimum;
    while (length % i > 0 && i < length)
        i++;
    return i;
};

export const transAuthors = (authors, maxLength) => {
    if (_.isEmpty(authors)) return "";
    let authorsStr = authors[0];
    let i = 1;
    const n = authors.length;
    while (i < n) {
        if (authorsStr.length + 2 + authors[i].length <= maxLength) {
            authorsStr = `${authorsStr}, ${authors[i]}`;
            i++;
        }
        else {
            authorsStr = `${authorsStr} and ${n - i} others`;
            i = n + 1;
        }
    }   
    return authorsStr;
}