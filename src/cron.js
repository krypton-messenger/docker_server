module.exports = (dbcallback)=>{
    dbcallback("DELETE FROM `authorisation` WHERE `authorisation`.`expires` < current_timestamp();");
}