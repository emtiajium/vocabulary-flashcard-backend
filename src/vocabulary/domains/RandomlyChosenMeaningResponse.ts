export type RandomlyChosenMeaningResponse = {
    meaning: string;
    word: string;
};

export type RandomlyChosenMeaningQueryResponse = RandomlyChosenMeaningResponse & {
    definitionId: string;
};
