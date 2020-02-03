import React, { useState, useEffect } from 'react';
import moment from 'moment';
import router from 'umi/router';
import { EditorState } from 'draft-js';
import Editor from '@/components/editor/ImageEditor';
import { Skeleton, Icon, Modal, Spin, Divider, Button, Form, Input, message } from 'antd';
import LECTURE from '@/assets/fakers/lecture';
import { exportToHTML } from '@/utils/editor';
import { minutesToHour } from '@/utils/utils';
import styles from './Lecture.less';

const ButtonGroup = Button.Group;
const FormItem = Form.Item;

const Lecture = ({ match }) => {
    const [lecture, setLecture] = useState(null);
    const [initLoading, setInitLoading] = useState(false);
    const [questionVisible, setQuestionVisible] = useState(false);
    const [questionTitle, setQuestionTitle] = useState({
        value: '',
        validateStatus: 'success',
        help: ''
    });
    const [questionContent, setQuestionContent] = useState(EditorState.createEmpty());
    useEffect(() => {
        const { lectureId } = match.params;
        message.success(`Fetch lecture with id ${lectureId}`);
        setInitLoading(true);
        setTimeout(() => {
            setLecture(LECTURE);
            setInitLoading(false);
        }, 2000);
    }, [match.params.courseId, match.params.lectureId]);
    const handleCompleteLecture = () => {
        const { lectureId } = match.params;
        message.success(`Complete lecture with id ${lectureId}`);
    };
    const handleAskQuestion = () => setQuestionVisible(true);
    const goToLecture = lectureId => {
        const { courseId } = match.params;
        router.push(`/learning/${courseId}/lecture/${lectureId}`);
    };
    const handleChangeQuestionTitle = e => {
        const val = e.target.value;
        if (!val || val.length === '') {
            setQuestionTitle({
                validateStatus: 'error',
                help: 'You must enter title',
                value: val
            });
        }
        else setQuestionTitle({
            validateStatus: 'success',
            help: '',
            value: val
        });
    };
    const handleCancelAskQuestion = () => {
        setQuestionTitle({
            validateStatus: 'success',
            help: '',
            value: ''
        });
        setQuestionContent(EditorState.createEmpty());
        setQuestionVisible(false);
    };
    const handleSubmitQuestion = () => {
        if (questionTitle.value === '') return message.error('You must enter title!');
        else {
            const contentState = questionContent.getCurrentContent();
            if (!contentState.hasText()) return message.error('You must enter question!');
        };
        //do something
        //call exportToHTML
        handleCancelAskQuestion();
    };
    return (
        <div className={styles.lecture}>
            {!lecture || initLoading ? (
                <div className={styles.loading}>
                    <Skeleton className={styles.titleSkeleton} active title={null} paragraph={{ rows: 1, width: '96%' }} />
                    <Skeleton active title={null} paragraph={{ rows: 2, width: ['62%', '42%'] }} />
                    <div className={styles.spin}>
                        <Spin indicator={<Icon type="loading" style={{ fontSize: 64 }} spin />} />
                    </div>
                </div>
            ) : (
                <React.Fragment>
                    <div className={styles.main}>
                        <div className={styles.title}>
                            {lecture.title}
                        </div>
                        <div className={styles.chapter}>
                            {`Chapter ${lecture.chapter.title}`}
                        </div>
                        <div className={styles.extra}>
                            <span className={styles.updatedAt}>
                                {(lecture.updatedAt === lecture.createdAt ? `Created on ${moment(lecture.updatedAt).format('MM/YYYY')}` : `Last updated on ${moment(lecture.updatedAt).format('MM/YYYY')}`)}
                            </span>
                            <span className={styles.time}>
                                {`${minutesToHour(lecture.time)} read.`}
                            </span>
                        </div>
                        <div className={styles.content}>
                            <div dangerouslySetInnerHTML={{ __html: lecture.content }} />
                        </div>
                    </div>
                    <Divider dashed className={styles.divider} />
                    <div className={styles.options}>
                        <ButtonGroup>
                            {lecture.prevLectureId && (
                                <Button  onClick={() => goToLecture(lecture.prevLectureId)}>
                                    <Icon type="left" />
                                    Prev
                                </Button>
                            )}
                            <Button  onClick={handleAskQuestion}>
                                Ask a question
                            </Button>
                            <Button  onClick={handleCompleteLecture}>
                                Completed
                            </Button>
                            {lecture.nextLectureId && (
                                <Button  onClick={() => goToLecture(lecture.nextLectureId)}>
                                    Next
                                    <Icon type="right" />
                                </Button>
                            )}
                        </ButtonGroup>
                    </div>
                    <Modal
                        className={styles.newQuestionModal}
                        title={<div className={styles.modalTitle}>Ask a new question</div>}
                        width={600}
                        centered
                        okText="Submit"
                        visible={questionVisible}
                        onOk={handleSubmitQuestion}
                        onCancel={handleCancelAskQuestion}
                        bodyStyle={{ padding: '35px 10px' }}
                    >
                        <Form>
                            <FormItem label="Title" help={questionTitle.help} validateStatus={questionTitle.validateStatus} required>
                                <Input 
                                    type="text"
                                    placeholder="Title"
                                    value={questionTitle.value}
                                    onChange={handleChangeQuestionTitle}
                                    style={{ width: '100%' }}
                                />
                            </FormItem>
                            <div className={styles.questionLectureTitle}>
                                <span>Lecture:</span>
                            </div>
                            <div className={styles.questionLectureWrapper}>
                                {`${lecture.title} -- ${lecture.chapter.title}`}
                            </div>
                            <div className={styles.questionContentTitle}>
                                <span>Content:</span>
                            </div>
                            <div className={styles.questionContentWrapper}>
                                <Editor
                                    editorState={questionContent}
                                    onChange={editorState => setQuestionContent(editorState)}
                                    placeholder="Enter question..."
                                />
                            </div>
                        </Form>
                    </Modal>
                </React.Fragment>
            )}
        </div>
    )
};

export default Lecture;