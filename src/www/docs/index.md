# Docs for Devs
With the help of the API you can integrate Krypton seamlessly into your own applications.
The base-url is `/api/`, while options like `GET`, `POST`, and `PUT` are generally allowed.
Both HTTP and HTTPS are permitted, allthough we recommend using a secure connection via HTTPS.
If you decide to access the API directly over the IP-Address of the server, the SSL-certificate will not be valid, therefore you must validate the certificate yourself.

## Passing the Parameters
Querying the API, you must allways give the parameter `action`, either in your GET- or POST-querydata or directly in the URL.
So that `/api/sendmessage` is the same as `/api/?action=sendmessage`. If both are combined and not the same value (`/api/sendmessage?action=getmessages`), the value in the querydata will be overruled.

## Response
The Response is a JSON-Object, containing at least one key at its root:
- `success` boolean
- [`data`] optional object | string
- [`error`] optional object

If `success` is false, `error` will be returned instead of `data`.
The `error` object will contain a error code `code` and a error description `description`, containing further informations about what error occured and how to could solve it.


## Actions overview
<details>
  <summary>General</summary>

- [sendmessage/sendmsg](#sendmessage)
- [getmessages / getmsg](#getmessages)
- [awaitmessages / update ⚠️](#awaitmessages)
- [sendfile](#sendfile)
- [getfile](#getfile)
- [serverinformation](#serverinformation)
</details>

<details>
    <summary>Users</summary>

- [createuser / createaccount](#createuser)
- [authenticate / authorize / auth](#authenticate)
- [knock](#knock)
- [search](#search)
- [getprofilepicture](#getprofilepicture)
- [setprofilepicture](#setprofilepicture)
- [getpublickey](#getpublickey)
</details>


<details>
    <summary>Keying</summary>

- [addchatkey](#addchatkey)
- [updatechatkeys](#updatechatkeys)
- [getchatkeys](#getchatkeys)
- [removechatkey / removechatkeys](#removechatkey)
- [getchatkeyinbox / getchatkeysinbox](#getchatkeyinbox)
- [awaitinbox / updatechatkeyinbox / awaitchatkeyinbox](#awaitinbox)

</details>


## Actions
### General
#### sendmessage
alias: sendmsg
##### Parameters
- `content` hex-string
- `chatid` hex-string
##### Returns
- `success` boolean

---

#### getmessages
alias getmsg
##### Parameters
- `chatid` hex-string
- [`offset`] optional integer default 0
- [`limit`] optional integer default 200
##### Returns
- `success` boolean
- `data` array of object:
    - `message-id` integer
    - `content` hex-string
    - `chat_id` hex-string
    - `encryptionType` string
    - `timestamp` UTC-Timestring

---


#### awaitmessages ⚠️
`deprecated`

alias update

##### Parameters
- `chatids` array of hex-string
##### Returns
- `success` boolean
- `data` array of object:
    - `message-id` integer
    - `content` hex-string
    - `chat_id` hex-string
    - `encryptionType` string
    - `timestamp` UTC-Timestring

returns after timeout or after recieving a message with one of the chatids (TTFB is delayed)

---


#### serverinformation
##### Parameters
`none`
##### Returns
- `success` boolean
- `data` object


---


#### sendfile
##### Parameters
- `content` string
##### Returns
- `success` boolean
- `data` string

---


#### getfile
##### Parameters
- `id` string
##### Returns
- `success` boolean
- `data` string

---


### Users
#### createuser
alias createaccount
##### Parameters
- `username` string
- `password` sha512 hash of actual password
- `privateKey` PEM of privateKey, AES-256-CBC-encrypted with sha256 of actual password
- `publicKey` PEM of publicKey
##### Returns
- `success` boolean

---