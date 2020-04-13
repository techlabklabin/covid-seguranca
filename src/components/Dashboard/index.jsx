import React, { Component } from 'react';
import { compose } from 'recompose';
import { withAuthorization, withEmailVerification } from "../../containers/Session";
import { withFirebase } from "../../containers/Firebase";
import { withRouter } from 'react-router-dom';
import firebase from "firebase";
import moment from 'moment';

import logo from "../../assets/logo.png";

import QrReader from 'react-qr-reader'

import { Button, Input, Row, Col, Modal, Icon, Typography, Divider } from 'antd'

import axios from 'axios'

const { Text } = Typography;

const INITIAL_STATE = {
    isScanning: false,
    data: {
        badge: null,
        temperature: 36.0,
        obs: null,
        sender: null,
        senderId: null,
        createdAt: "",
        location: null,
        userId: null
    },
    status: null,
    anotations: [],
    touchpoints: [],
    name: null,
    symptoms: [],
    haste: null,
    origin: null,
    obs: null,
    badge: null,
    senderName: null,
    senderEmail: null,
    color: "#ffffff",
    textAlert: "",
    textContent: "",
    visible: false,
    date: "",
    chronic: [],
    area: "",
    phone: "",
    cpf: "",
    contactSuspect: "",
    hasTravel: "",
    temperature: "",
    cpfInput: "",
    isLoading: true,
}

const RESPIRATORY_CHART = [
    "Tosse",
    "Dificuldade para respirar",
    "Coriza"
];

const CHRONIC_CHART = [
    "Diabetes",
    "Gestantes",
    "Doenças pulmonares",
    "Doença renais",
    "HIV",
    "Cancer",
    "Asma ou afins",
    "Doença cardíaca"
];

const TEMPERATURE = {
    "abaixo_de_37.7": "Abaixo de 37.7°",
    "igual_ou_acima_de_37.8": "Igual ou acima de 37.8°",
    "acima_de_39": "Acima de 39.0°",
};

class Dashboard extends Component {

    constructor() {
        super()
        this.state = { ...INITIAL_STATE }
    }

    componentDidMount() {
        //this.updatePosition = window.setInterval(this.handlePosition, 5000);
        this.setState({
            data: {
                ...this.state.data,
                sender: (localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')).username : "Anônimo"),
                senderId: JSON.parse(localStorage.getItem('authUser')).uid,
            }
        });

        //this.getUserInformation();
    }

    handleBeginScan = () => {
        this.setState({
            isScanning: true
        })
    }

    handleError = () => {
        alert("Tente novamente");
    }

    handleScan = (qrcodeRead) => {
        if (qrcodeRead) {
            let id = qrcodeRead.split(" ");
            this.setState({
                data: {
                    userId: id,
                    ...this.state.data,
                    badge: qrcodeRead
                }
            }, () => {
                let id = qrcodeRead.split(" ");
                this.getUserInformation(id[0]);
            })

        }
    }

    getUserInformation = async (id) => {
        this.getAxiosInstance().get('/diagnosis/' + id).then(response => {
            this.setState({
                isLoading: false
            })
            const sorted = [].concat(response.data)
                .sort((a, b) => a.createdAt._seconds < b.createdAt._seconds)
            //let latestDiagnosis = response.data.sort((a,b) => {return response.data.})
            let latestDiagnosis = sorted[0];

            let colorBackground = "#ffffff"
            let text = "Diagnóstico não encontrado"
            let textDesc = ""
            let statusText = latestDiagnosis.status.label
            let symptomsText = [].concat(latestDiagnosis.respiratoryChart.map(i => { return RESPIRATORY_CHART[i] }))
            let chronicText = [].concat(latestDiagnosis.chronicChart.map(i => { return CHRONIC_CHART[i] }))


            if (latestDiagnosis.haste.key == 0) {
                colorBackground = "#d11a0e"
                text = "Negado"
                textDesc = "Não deixe que o colaborador adentre, conduza-o ao médico"
            } else if (latestDiagnosis.haste.key == 1 || latestDiagnosis.haste.key == 2) {
                colorBackground = "#fee500"
                text = "Atenção"
                textDesc = "Verifique o estado de saúde do colaborador"
            } else if (latestDiagnosis.haste.key == 3) {
                colorBackground = "#009530"
                text = "Tudo OK"
                textDesc = "Pode deixar o colaborador entrar"
            }


            let touchpointsText = [].concat(latestDiagnosis.touchpoints.map((i) => {
                let isCompanyText = ""
                if (i.isCompany) {
                    isCompanyText = "Colaborador <nome-empresa>"
                } else {
                    isCompanyText = "Externo"
                }
                return <p>  - {isCompanyText} <b>Nome: </b>{i.name} <b>Telefone: </b>{i.phone} </p>
            }))

            let temperatureText = TEMPERATURE[latestDiagnosis.temperature]
            this.setState({
                status: statusText,
                anotations: latestDiagnosis.annotations,
                touchpoints: touchpointsText,
                name: latestDiagnosis.name,
                symptoms: symptomsText,
                chronic: chronicText,
                haste: latestDiagnosis.haste.label,
                origin: latestDiagnosis.origin,
                obs: latestDiagnosis.obs,
                date: moment.unix(latestDiagnosis.createdAt._seconds).format("L H:mm:ss"),
                badge: latestDiagnosis.key,
                senderName: latestDiagnosis.sender.name,
                senderEmail: latestDiagnosis.sender.email,
                color: colorBackground,
                textAlert: text,
                textContent: textDesc,
                area: latestDiagnosis.medicalUnit.label,
                hasTravel: latestDiagnosis.hasTravel,
                contactSuspect: latestDiagnosis.contactSuspect,
                cpf: latestDiagnosis.cpf,
                phone: latestDiagnosis.phone,
                temperature: temperatureText
            })
        }).catch(error => {
            alert("Diagnóstico não encontrado");
            window.location.reload();
        })
    }

    getAxiosInstance() {
        return axios.create({
            baseURL: ' https://us-central1-covid-19-b626a.cloudfunctions.net/',
            headers: {
                "Authorization": "Bearer " + (localStorage.getItem('authUser') && JSON.parse(localStorage.getItem('authUser')).jwtToken),
            },

        })
    }

    // handlePosition = () => {
    //     if (this.props.isGeolocationEnabled && this.props.coords) {
    //         this.setState({
    //             data: {
    //                 ...this.state.data,
    //                 location: {
    //                     lat: this.props.coords.latitude,
    //                     lng: this.props.coords.longitude
    //                 }
    //             }
    //         })
    //         return true;
    //     } else {
    //         alert("Posição não encontrada, tente atualizar a página e autorize a localização");
    //         return false;
    //     }
    // }

    handleTemperature = (temperature) => {
        this.setState({
            data: {
                ...this.state.data,
                temperature: temperature
            }
        })
    }

    handleObs = (e) => {
        this.setState({
            data: {
                ...this.state.data,
                obs: e.target.value
            }
        })
    }

    insertReport = async () => {
        this.setState({
            data: {
                ...this.state.data,
                createdAt: moment().format(),
            }
        })

        const db = firebase.firestore();
        this.state.data.createdAt = moment().format()

        db.settings({
            timestampsInSnapshots: true
        });

        const userRef = await db.collection("reports").add(this.state.data);
        return userRef;
    }

    handleSend = () => {
        if (this.insertReport()) {
            const phone = process.env.REACT_APP_CONFIRMATION_DESTINY_PHONE;
            const message = `%F0%9F%98%B7%20Report%20suspeita%20de%20COVID-19%3A%0A%0AMatricula%3A%20${encodeURIComponent(this.state.data.badge)}%0ATemperatura%3A%20${encodeURIComponent(this.state.data.temperature)}%0ALider%3A%20${encodeURIComponent(this.state.data.sender)}%0AOBS%3A%20${encodeURIComponent(this.state.data.obs)}`
            window.location.href = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
            this.props.history.push("/dashboard");
        }
    }

    showModal = () => {
        this.setState({
            visible: true,
        });
    };

    handleOk = e => {
        this.setState({
            visible: false,
        });
    };

    handleCancel = e => {
        this.setState({
            badge: null,
        });
    };

    handleBack = e => {
        window.location.reload()
    };

    onChange = (e) => {
        this.setState({ cpfInput: e.target.value })
    }

    onClick = (e) => {
        const cpf = this.state.cpfInput

        this.setState({
            data: {
                ...this.state.data,
                badge: cpf
            }
        }, () => {
            this.getUserInformation(cpf);
        })
    }

    render() {
        return (
            <div>

                <div style={{ backgroundColor: this.state.color }}>
                    {
                        this.state.data.badge ?
                            this.state.isLoading ?
                                <div style={{ fontSize: 50 }} className="divSpin">
                                    <Icon type="loading" />
                                </div>
                                :
                                <div className="wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "top", height: "100vh" }}>
                                    <Row className={"mt-30"} style={{ width: "100%" }}>
                                        {/* <Col className={"text-center"} md={24}>
                                        <img width={"200px"} className="mb-20" src={logo} alt="logo" />
                                    </Col> */}
                                        <Col className={"mb-30 text-center"} style={{ marginTop: 60 }} md={24}>
                                            <Text style={{ color: "#ffffff", fontSize: 50 }}><b>{this.state.textAlert}</b></Text>
                                        </Col>
                                        <Col className={"mb-30 text-center"} style={{ marginTop: -20 }} md={24}>
                                            <Text style={{ color: "#ffffff", fontSize: 20 }}><b>{this.state.textContent}</b></Text>
                                        </Col>
                                        <Col className={"mb-30 text-center"} style={{ marginTop: -20 }} md={24}>
                                            <Text style={{ color: "#ffffff" }}><b>Situação:</b> {this.state.status} </Text>
                                        </Col>
                                        <Col className={"mb-30 text-center"} style={{ marginTop: -20 }} md={24}>
                                            <Text style={{ color: "#ffffff" }}><b>Nome:</b> {this.state.name} </Text>
                                        </Col>
                                        <Col className={"mb-30 text-center"} style={{ marginTop: -20 }} md={24}>
                                            <Text style={{ color: "#ffffff" }}><b>Data da última avaliação:</b> {this.state.date} </Text>
                                        </Col>
                                        <Col md={24} className={"mb-30"} style={{ marginTop: 30 }} >
                                            <Button onClick={this.showModal} className="btn-fiscal" block>
                                                Mais Detalhes
                                        </Button>
                                            <Button onClick={this.handleBack} style={{ marginTop: 10 }} className="btn-fiscal2" block>
                                                Voltar
                                        </Button>
                                        </Col>

                                    </Row>

                                    <Modal
                                        title="Detalhes sobre o colaborador"
                                        centered
                                        visible={this.state.visible}
                                        onOk={this.handleOk}
                                        onCancel={this.handleCancel}
                                    >
                                        <p><b>Situação:</b> {this.state.status}</p>
                                        <p><b>Nome:</b> {this.state.name}</p>
                                        <p><b>Área:</b> {this.state.area}</p>
                                        <p><b>Data última avaliação:</b> {this.state.date}</p>
                                        <p><b>Telefone:</b> {this.state.phone}</p>
                                        <p><b>CPF:</b> {this.state.cpf}</p>
                                        <p><b>Id colaborador:</b> {this.state.badge}</p>
                                        <p><b>Nível de Urgência:</b> {this.state.haste}</p>
                                        <p><b>Tem contato suspeito:</b> {this.state.contactSuspect ? "Sim" : "Não"}</p>
                                        <p><b>Teve viagem:</b> {this.state.hasTravel ? "Sim" : "Não"}</p>
                                        <p><b>Temperatura:</b> {this.state.temperature}</p>
                                        <p><b>Quem enviou:</b> {this.state.senderName}, {this.state.senderEmail}</p>
                                        <p><b>Anotações:</b> {this.state.anotations.map((i) => i["text"] ? i["text"] + ", " : "")}</p>
                                        <p><b>Pontos de Contato:</b> {this.state.touchpoints.map((i) => <li key={i}>{i}</li>)}</p>
                                        <p><b>Sintomas:</b> {this.state.symptoms.map((i) => i + ", ")}</p>
                                        <p><b>Sintomas Crônicos:</b> {this.state.chronic.map((i) => i + ", ")}</p>
                                        <p><b>Origem:</b> {this.state.origin}</p>
                                        <p><b>Observações:</b> {this.state.obs}</p>
                                    </Modal>
                                </div>
                            :
                            <div className="wrapper">
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                                    {
                                        !this.state.isScanning &&
                                        <Row>
                                            <Col className={"text-center"} md={24}>
                                                <img width={"200px"} className="mb-20" src={logo} alt="logo" />
                                            </Col>
                                            <Col md={24}>
                                                <Button block onClick={this.handleBeginScan} size={"large"} className="btn-brand" icon="scan">
                                                    Scanear crachá
                                              </Button>
                                            </Col>
                                            <Divider>
                                                ou
                                            </Divider>
                                            <Col md={24}>
                                                <Input
                                                    placeholder="Buscar por CPF"
                                                    type="number"
                                                    size="large"
                                                    onChange={this.onChange}
                                                />
                                                <Button block className="btn-brand mt-10" onClick={this.onClick}>Buscar</Button>
                                            </Col>

                                        </Row>
                                    }

                                    {
                                        this.state.isScanning &&

                                        <QrReader
                                            delay={300}
                                            onError={this.handleError}
                                            onScan={this.handleScan}
                                            style={{ width: '100%' }}
                                        />
                                    }
                                </div>
                            </div>
                    }
                </div>

            </div>
        );
    }
}

const condition = authUser => !!authUser; // just check if its not null
export default compose(
    withEmailVerification,
    withAuthorization(condition),
    withRouter,
    withFirebase,
)(Dashboard);