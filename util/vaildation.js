const getErrorDetail = (cipherResult, exactResult) => {
    const error = Math.abs(exactResult - cipherResult);
    const errorPercent = (error / exactResult) * 100;

    return {
        cipherResult: cipherResult,
        exactResult: exactResult,
        error: error,
        errorPercent: errorPercent,
    };
};

const getErrorDetailArray = (resultArray, exactResults) => {
    if (resultArray.length != exactResults.length) {
        console.log(resultArray.length, exactResults.length);
        throw new Error('cipherResult length not equrl to exactResults length');
    }

    const errorPercents = [];
    const errors = exactResults.map((exactValue, i) => {
        const error = Math.abs(exactValue - resultArray[i]);
        errorPercents[i] = (error / exactValue) * 100;
        return error;
    });

    return {
        cipherResults: resultArray,
        exactResults: exactResults,
        errors: errors,
        errorPercents: errorPercents,
    };
};

const getMaxErrorValueArray = (resultArray, exactResults) => {
    const errorDetail = getErrorDetailArray(resultArray, exactResults);

    const maxErrorIndex = errorDetail.errors.indexOf(Math.max(...errorDetail.errors));

    const maxErrorCipherValue = errorDetail.cipherResults[maxErrorIndex];
    const maxErrorExactValue = errorDetail.exactResults[maxErrorIndex];
    const maxError = errorDetail.errors[maxErrorIndex];
    const maxErrorPercent = errorDetail.errorPercents[maxErrorIndex];

    return {
        maxErrorCipherValue: maxErrorCipherValue,
        maxErrorExactValue: maxErrorExactValue,
        maxError: maxError,
        maxErrorPercent: maxErrorPercent,
    };
};

const getAvgFirstTen = array => {
    if (array.length > 10) array = array.slice(0, 10);

    const sum = array.reduce((prevValue, curValue) => prevValue + curValue, 0);
    const avgValueArray = sum / 10;

    return avgValueArray;
};

const handleFindError = (
    node,
    config,
    SEALContexts,
    cipherResult,
    newExactResult,
    inputNodeType,
) => {
    const showErrorDetail = config.showErrorDetail;
    const showErrorPercent = config.showErrorPercent;

    if (showErrorPercent || showErrorDetail) {
        const decryptor = SEALContexts.decryptor;
        const encoder = SEALContexts.encoder;
        const resultArray = encoder.decode(decryptor.decrypt(cipherResult));

        if (inputNodeType == 'single') {
            const resultAvg = getAvgFirstTen(resultArray);
            const errorDetail = getErrorDetail(resultAvg, newExactResult);

            if (showErrorDetail) node.warn(errorDetail);

            return showErrorPercent ? ` Error Percent: ${errorDetail.errorPercent}` : ' ';
        } else if (inputNodeType == 'range') {
            const maxErrorDetail = getMaxErrorValueArray(resultArray, newExactResult);

            if (showErrorDetail) node.warn(maxErrorDetail);

            return showErrorPercent ? ` Error Percent: ${maxErrorDetail.maxErrorPercent}` : ' ';
        }
    } else {
        return ' ';
    }
};

module.exports = {
    getErrorDetail: getErrorDetail,
    getErrorDetailArray: getErrorDetailArray,
    getAvgFirstTen: getAvgFirstTen,
    getMaxErrorValueArray: getMaxErrorValueArray,
    handleFindError: handleFindError,
};
